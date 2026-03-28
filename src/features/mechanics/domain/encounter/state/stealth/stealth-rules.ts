/**
 * Single owner for stealth / hidden-from-observer **rules and mutations**. Other modules call these
 * exports; do not duplicate stealth logic elsewhere.
 *
 * **Boundary:** Perception (`canPerceiveTargetOccupantForCombat`, `canSeeForTargeting`, pair visibility
 * for attacks) answers whether an observer can **see** a subject. `CombatantStealthRuntime` records
 * observer-relative stealth on top of that seam — stealth is **not** a second sight engine.
 *
 * **Reconciliation** helpers keep stored `hiddenFromObserverIds` aligned when perception or explicit
 * reveal rules change so stealth does not become a divergent truth source. Losing hide **eligibility**
 * (cover/concealment basis for a new Hide attempt) alone does **not** prune observer-relative hidden state.
 */

import type { EncounterEnvironmentBaselinePatch } from '@/features/mechanics/domain/environment/environment.types'

import { reconcileAwarenessGuessesWithPerception } from '../awareness/awareness-rules'
import { getPassivePerceptionScore } from '../awareness/passive-perception'
import {
  canPerceiveTargetOccupantForCombat,
  evaluatePerceiveTargetOccupantForCombat,
  type PerceiveTargetOccupantEvaluation,
} from '../visibility/combatant-pair-visibility'
import { updateEncounterEnvironmentBaseline } from '../environment/environment-baseline-mutations'
import { updateEncounterCombatant } from '../mutations/mutations'
import { getCombatantHideEligibilityExtensionOptions } from './combatant-hide-eligibility'
import {
  getHideAttemptEligibilityDenialReason,
  pairSupportsHideWorldBasisFromObserver,
  resolveHideEligibilityForCombatant,
  type HideAttemptEligibilityDenialReason,
  type HideEligibilityExtensionOptions,
  type HideEligibilityFeatureFlags,
} from './sight-hide-rules'
import { getCellForCombatant } from '@/features/encounter/space/space.helpers'
import type { CombatantStealthRuntime } from '../types/combatant.types'
import type { EncounterState } from '../types'
import type { EncounterViewerPerceptionCapabilities } from '@/features/mechanics/domain/perception/perception.types'
import {
  appendStealthHideBasisLostContextNote,
  appendStealthHideSuccessAppliedNote,
  appendStealthPrunedObserverCanPerceiveNote,
} from './stealth-debug-log'

export type { HideEligibilityExtensionOptions, HideEligibilityFeatureFlags }

export type StealthRulesOptions = {
  perceptionCapabilities?: EncounterViewerPerceptionCapabilities
  /**
   * Optional override for hide eligibility (tests / DM tools). Normal runtime uses
   * `getCombatantHideEligibilityExtensionOptions` from `stats.skillRuntime.hideEligibilityFeatureFlags`.
   */
  hideEligibility?: HideEligibilityExtensionOptions
}

/**
 * Hide vs passive Perception: **strictly greater than** beats the observer (5e-style tie: observer wins).
 * `stealthTotal === passivePerception` does **not** count as hidden from that observer.
 */
export function stealthBeatsPassivePerception(stealthTotal: number, passivePerception: number): boolean {
  return stealthTotal > passivePerception
}

export type HideResolutionOutcome =
  | { kind: 'no-eligible-observers' }
  | {
      kind: 'resolved'
      stealthTotal: number
      /** Observers for whom eligibility passed and Stealth beat passive Perception. */
      beatenObserverIds: string[]
      /** Eligible observers who did not lose the comparison (including ties). */
      failedObserverIds: string[]
    }

function hideEligibilityOpts(options?: StealthRulesOptions): Parameters<typeof getHideAttemptEligibilityDenialReason>[3] {
  if (!options?.perceptionCapabilities && !options?.hideEligibility) return undefined
  return {
    ...(options.perceptionCapabilities != null ? { capabilities: options.perceptionCapabilities } : {}),
    ...(options.hideEligibility != null ? { hideEligibility: options.hideEligibility } : {}),
  }
}

function perceptionCapabilitiesOnly(
  options?: StealthRulesOptions,
): { capabilities?: EncounterViewerPerceptionCapabilities } | undefined {
  return options?.perceptionCapabilities != null ? { capabilities: options.perceptionCapabilities } : undefined
}

/**
 * Hide **attempt** eligibility only (can you try to hide from this observer). Delegates to
 * {@link getHideAttemptEligibilityDenialReason} — same world + occupant seam as before this module existed.
 */
export function getStealthHideAttemptDenialReason(
  state: EncounterState,
  hiderId: string,
  observerId: string,
  options?: StealthRulesOptions,
): HideAttemptEligibilityDenialReason | null {
  return getHideAttemptEligibilityDenialReason(state, hiderId, observerId, hideEligibilityOpts(options))
}

/**
 * Records runtime hidden state **after** the caller has already determined outcome (e.g. manual DM
 * adjudication or tests). Prefer {@link resolveHideWithPassivePerception} for standard hide resolution
 * vs passive Perception. The explicit `observerIds` parameter remains the seam for future **active**
 * opposed-roll outputs.
 */
export function applyStealthHideSuccess(
  state: EncounterState,
  hiderId: string,
  observerIds: string[],
  applyOptions?: { hideEligibility?: HideEligibilityExtensionOptions },
): EncounterState {
  const unique = [...new Set(observerIds)].filter((id) => id !== hiderId)
  if (unique.length === 0) return state

  return updateEncounterCombatant(state, hiderId, (c) => {
    const prev = c.stealth?.hiddenFromObserverIds ?? []
    const merged = [...new Set([...prev, ...unique])]
    const next: CombatantStealthRuntime = {
      ...c.stealth,
      hiddenFromObserverIds: merged,
      hideEligibility:
        applyOptions?.hideEligibility ?? getCombatantHideEligibilityExtensionOptions(c) ?? c.stealth?.hideEligibility,
    }
    return { ...c, stealth: next }
  })
}

/**
 * Candidate observers for a hide attempt: other-side combatants for whom hide **eligibility** passes
 * (`getStealthHideAttemptDenialReason` === null). Used by **`resolveHideWithPassivePerception`** before
 * comparing Stealth to **`getPassivePerceptionScore`**. Does not filter by distance or cover (future work).
 */
export function resolveDefaultHideObservers(
  state: EncounterState,
  hiderId: string,
  options?: StealthRulesOptions,
): string[] {
  const hider = state.combatantsById[hiderId]
  if (!hider) return []
  const candidateIds = hider.side === 'party' ? state.enemyCombatantIds : state.partyCombatantIds
  return candidateIds.filter((oid) => {
    if (oid === hiderId) return false
    return getStealthHideAttemptDenialReason(state, hiderId, oid, options) === null
  })
}

function hideAttemptDenialReasonToMessage(reason: HideAttemptEligibilityDenialReason): string {
  switch (reason) {
    case 'self':
      return 'Invalid hide context.'
    case 'missing-hider-placement':
      return 'Not placed on the grid.'
    case 'observer-sees-without-concealment':
      return 'Need concealment or cover from observers.'
    default: {
      const _exhaustive: never = reason
      return _exhaustive
    }
  }
}

/**
 * When the Hide combat action cannot be attempted from the hider’s **current** cell/position
 * (same basis as {@link resolveDefaultHideObservers} / the hide resolver). Returns `null` when a hide
 * attempt is allowed (at least one eligible observer). UI and {@link getActionResolutionReadiness} use this;
 * do not reimplement eligibility in components.
 */
export function getHideActionUnavailableReason(
  state: EncounterState,
  hiderId: string,
  options?: StealthRulesOptions,
): string | null {
  if (resolveDefaultHideObservers(state, hiderId, options).length > 0) {
    return null
  }

  const hider = state.combatantsById[hiderId]
  if (!hider) {
    return 'Cannot hide.'
  }

  const opposingIds = hider.side === 'party' ? state.enemyCombatantIds : state.partyCombatantIds
  const otherSide = opposingIds.filter((id) => id !== hiderId)
  if (otherSide.length === 0) {
    return 'No opponents to hide from.'
  }

  if (state.space && state.placements) {
    const cell = getCellForCombatant(state.placements, hiderId)
    if (!cell) {
      return 'Not placed on the grid.'
    }
  }

  for (const observerId of otherSide) {
    const denial = getStealthHideAttemptDenialReason(state, hiderId, observerId, options)
    if (denial != null) {
      return hideAttemptDenialReasonToMessage(denial)
    }
  }

  return 'Cannot hide from any observer (concealment / cover).'
}

/**
 * Resolves a completed **Stealth total** (d20 + modifiers from the action/resolver — not rolled here)
 * against each **eligible** observer’s passive Perception. Updates `stealth.hiddenFromObserverIds`:
 * eligible observers who are **beaten** are added; eligible observers who **fail** the comparison are
 * removed. Observers not in the eligible set keep any prior entry unchanged.
 *
 * **Threshold:** {@link stealthBeatsPassivePerception} — Stealth must be **strictly greater** than
 * passive Perception to be hidden from that observer.
 */
export function resolveHideWithPassivePerception(
  state: EncounterState,
  hiderId: string,
  stealthTotal: number,
  options?: StealthRulesOptions,
): { state: EncounterState; outcome: HideResolutionOutcome } {
  const candidates = resolveDefaultHideObservers(state, hiderId, options)
  if (candidates.length === 0) {
    return { state, outcome: { kind: 'no-eligible-observers' } }
  }

  const beatenObserverIds: string[] = []
  const failedObserverIds: string[] = []

  for (const oid of candidates) {
    const observer = state.combatantsById[oid]
    if (!observer) continue
    const passive = getPassivePerceptionScore(observer)
    if (stealthBeatsPassivePerception(stealthTotal, passive)) {
      beatenObserverIds.push(oid)
    } else {
      failedObserverIds.push(oid)
    }
  }

  const hider = state.combatantsById[hiderId]
  if (!hider) {
    return { state, outcome: { kind: 'no-eligible-observers' } }
  }

  const prev = hider.stealth?.hiddenFromObserverIds ?? []
  const candidateSet = new Set(candidates)
  const nextIds = new Set(prev.filter((id) => !candidateSet.has(id)))
  for (const oid of beatenObserverIds) {
    nextIds.add(oid)
  }

  let nextState = updateEncounterCombatant(state, hiderId, (c) => ({
    ...c,
    stealth:
      nextIds.size === 0
        ? undefined
        : {
            ...c.stealth,
            hiddenFromObserverIds: [...nextIds],
            hideEligibility:
              resolveHideEligibilityForCombatant(state, hiderId, options, 'hide-attempt') ?? c.stealth?.hideEligibility,
          },
  }))

  if (beatenObserverIds.length > 0) {
    nextState = appendStealthHideSuccessAppliedNote(nextState, hiderId, beatenObserverIds)
  }

  return {
    state: nextState,
    outcome: {
      kind: 'resolved',
      stealthTotal,
      beatenObserverIds,
      failedObserverIds,
    },
  }
}

/**
 * **Reconciliation:** remove observer ids from each subject’s `hiddenFromObserverIds` when that
 * observer **can** now perceive the subject’s occupant — keeps stealth aligned with the shared
 * perception seam. Also runs {@link reconcileAwarenessGuessesWithPerception} so sound-only guesses
 * drop when vision applies.
 */
export function reconcileStealthHiddenForPerceivedObservers(
  state: EncounterState,
  options?: StealthRulesOptions,
): EncounterState {
  const cap = perceptionCapabilitiesOnly(options)
  let next = state

  for (const combatant of Object.values(next.combatantsById)) {
    const stealth = combatant.stealth
    if (!stealth?.hiddenFromObserverIds?.length) continue

    const filtered = stealth.hiddenFromObserverIds.filter(
      (observerId) => !canPerceiveTargetOccupantForCombat(next, observerId, combatant.instanceId, cap),
    )

    if (filtered.length === stealth.hiddenFromObserverIds.length) continue

    const removedObserverIds = stealth.hiddenFromObserverIds.filter((id) => !filtered.includes(id))

    const perceiveByObserverId: Record<string, PerceiveTargetOccupantEvaluation> = {}
    for (const observerId of removedObserverIds) {
      perceiveByObserverId[observerId] = evaluatePerceiveTargetOccupantForCombat(
        next,
        observerId,
        combatant.instanceId,
        cap,
      )
    }

    next = updateEncounterCombatant(next, combatant.instanceId, (c) => ({
      ...c,
      stealth:
        filtered.length === 0
          ? undefined
          : {
              ...c.stealth,
              hiddenFromObserverIds: filtered,
            },
    }))
    next = appendStealthPrunedObserverCanPerceiveNote(
      next,
      combatant.instanceId,
      removedObserverIds,
      perceiveByObserverId,
    )
  }

  return reconcileAwarenessGuessesWithPerception(next)
}

/**
 * **Authoritative stealth reconciliation** after movement, placement, environment baseline, or
 * environment-zone changes (including attached-aura zone projection). Call this (or code paths that
 * delegate to it) so hidden state stays aligned with the shared **perception** seam. Hide **entry**
 * still requires eligibility ({@link getHideAttemptEligibilityDenialReason}); **sustain** does not drop
 * entries solely because eligibility for a **new** Hide attempt would fail after the world changes.
 *
 * **Pipeline (only):**
 * 1. {@link reconcileStealthHiddenForPerceivedObservers} — remove hidden-from entries when the observer
 *    can perceive the subject’s occupant (the sole movement/environment **state** change for stealth).
 * 2. Append hide-basis **diagnostic** combat-log lines when pair hide world basis is gone but the observer
 *    still cannot perceive (via `appendStealthHideBasisLostContextNote`; **no** stealth mutation).
 *
 * **Integration:** `reconcileBattlefieldEffectAnchors` (after zone sync), `updateEncounterEnvironmentBaseline`,
 * and `useEncounterState` `handleMoveCombatant` (after `moveCombatant` + battlefield anchor pass) end with
 * this sequence so runtime play does not leave stale `hiddenFromObserverIds`.
 */
export function reconcileStealthAfterMovementOrEnvironmentChange(
  state: EncounterState,
  options?: StealthRulesOptions,
): EncounterState {
  const afterPerception = reconcileStealthHiddenForPerceivedObservers(state, options)
  return appendStealthHideBasisDiagnosticsAfterPerception(afterPerception, options)
}

/**
 * Combat-log **diagnostics** only: pair hide world basis is absent while the observer still cannot
 * perceive the occupant — does **not** remove hidden-from entries. Uses {@link pairSupportsHideWorldBasisFromObserver}
 * because {@link getHideAttemptEligibilityDenialReason} only encodes “sees occupant without basis,” not
 * “no basis but still unseen.”
 */
function appendStealthHideBasisDiagnosticsAfterPerception(
  state: EncounterState,
  options?: StealthRulesOptions,
): EncounterState {
  const cap = perceptionCapabilitiesOnly(options)
  let next = state

  for (const combatant of Object.values(state.combatantsById)) {
    const hidden = combatant.stealth?.hiddenFromObserverIds
    if (!hidden?.length) continue

    const effectiveHideEligibility = resolveHideEligibilityForCombatant(
      state,
      combatant.instanceId,
      { hideEligibility: options?.hideEligibility },
      'stealth-sustain',
    )

    const basisLostWhileStillUnseen: string[] = []
    for (const observerId of hidden) {
      if (canPerceiveTargetOccupantForCombat(state, observerId, combatant.instanceId, cap)) continue
      const hasPairBasis = pairSupportsHideWorldBasisFromObserver(
        state,
        observerId,
        combatant.instanceId,
        effectiveHideEligibility,
      )
      if (hasPairBasis) continue
      basisLostWhileStillUnseen.push(observerId)
    }
    if (basisLostWhileStillUnseen.length > 0) {
      next = appendStealthHideBasisLostContextNote(next, combatant.instanceId, basisLostWhileStillUnseen)
    }
  }
  return next
}

/**
 * Applies {@link updateEncounterEnvironmentBaseline} then {@link reconcileStealthAfterMovementOrEnvironmentChange}.
 * Use this when global baseline lighting/obscurement changes at runtime (composition lives here to avoid
 * circular imports between baseline mutations and this module).
 */
export function applyEncounterEnvironmentBaselinePatchAndReconcileStealth(
  state: EncounterState,
  patch: EncounterEnvironmentBaselinePatch,
  options?: StealthRulesOptions,
): EncounterState {
  return reconcileStealthAfterMovementOrEnvironmentChange(updateEncounterEnvironmentBaseline(state, patch), options)
}

function clearStealthForCombatant(state: EncounterState, combatantId: string): EncounterState {
  const c = state.combatantsById[combatantId]
  if (c == null || c.stealth == null) return state
  return updateEncounterCombatant(state, combatantId, ({ stealth: _s, ...rest }) => rest)
}

/**
 * Clear the attacker’s **entire** `stealth` wrapper **after** the attack **roll** is resolved in
 * `action-resolver.ts` (modifiers use occupant visibility only — see `combatant-pair-visibility.ts`).
 *
 * **Semantics:** global reveal — **not** observer-relative. **TODO:** per-observer reveal or
 * location-only reveal for certain features/spells.
 */
export function breakStealthOnAttack(state: EncounterState, attackerId: string): EncounterState {
  return clearStealthForCombatant(state, attackerId)
}

/** Whether `subjectId` is currently marked hidden from `observerId` (runtime bookkeeping only). */
export function isHiddenFromObserver(state: EncounterState, observerId: string, subjectId: string): boolean {
  return state.combatantsById[subjectId]?.stealth?.hiddenFromObserverIds.includes(observerId) ?? false
}
