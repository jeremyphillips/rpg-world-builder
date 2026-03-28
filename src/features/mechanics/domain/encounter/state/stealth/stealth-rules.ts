/**
 * Single owner for stealth / hidden-from-observer **rules and mutations**. Other modules call these
 * exports; do not duplicate stealth logic elsewhere.
 *
 * **Boundary:** Perception (`canPerceiveTargetOccupantForCombat`, `canSeeForTargeting`, pair visibility
 * for attacks) answers whether an observer can **see** a subject. `CombatantStealthRuntime` records
 * observer-relative stealth on top of that seam — stealth is **not** a second sight engine.
 *
 * **Reconciliation** helpers keep stored `hiddenFromObserverIds` aligned when visibility/concealment
 * changes so stealth does not become a divergent truth source.
 */

import type { EncounterEnvironmentBaselinePatch } from '@/features/mechanics/domain/encounter/environment/environment.types'

import { reconcileAwarenessGuessesWithPerception } from '../awareness/awareness-rules'
import { getPassivePerceptionScore } from '../awareness/passive-perception'
import { canPerceiveTargetOccupantForCombat } from '../visibility/combatant-pair-visibility'
import { updateEncounterEnvironmentBaseline } from '../environment/environment-baseline-mutations'
import { updateEncounterCombatant } from '../mutations/mutations'
import { getCombatantHideEligibilityExtensionOptions } from './combatant-hide-eligibility'
import {
  getHideAttemptEligibilityDenialReason,
  resolveHideEligibilityForCombatant,
  type HideAttemptEligibilityDenialReason,
  type HideEligibilityExtensionOptions,
  type HideEligibilityFeatureFlags,
} from './sight-hide-rules'
import type { CombatantStealthRuntime } from '../types/combatant.types'
import type { EncounterState } from '../types'
import type { EncounterViewerPerceptionCapabilities } from '../../environment/perception.types'

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

  const nextState = updateEncounterCombatant(state, hiderId, (c) => ({
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
  }

  return reconcileAwarenessGuessesWithPerception(next)
}

/**
 * **Authoritative stealth reconciliation** after movement, placement, environment baseline, or
 * environment-zone changes (including attached-aura zone projection). Call this (or code paths that
 * delegate to it) so hidden state stays aligned with the shared perception seam plus the **same**
 * hide eligibility as hide entry ({@link getHideAttemptEligibilityDenialReason}, including
 * observer-relative terrain cover when a grid is present).
 *
 * **Deterministic order:**
 * 1. For each combatant that currently has `stealth`, {@link reconcileStealthBreakWhenNoConcealmentInCell}
 *    — drop observer ids that no longer pass hide eligibility (observer-relative cover + concealment).
 * 2. {@link reconcileStealthHiddenForPerceivedObservers} — drop observer ids when that observer can
 *    perceive the subject’s occupant (partial / observer-relative pruning).
 *
 * **Integration:** `reconcileBattlefieldEffectAnchors` (after zone sync), `updateEncounterEnvironmentBaseline`,
 * and `useEncounterState` `handleMoveCombatant` (after `moveCombatant` + battlefield anchor pass) end with
 * this sequence so runtime play does not leave stale `hiddenFromObserverIds`.
 */
export function reconcileStealthAfterMovementOrEnvironmentChange(
  state: EncounterState,
  options?: StealthRulesOptions,
): EncounterState {
  const hiderIds = Object.values(state.combatantsById)
    .filter((c) => c.stealth != null)
    .map((c) => c.instanceId)

  let next = state
  for (const id of hiderIds) {
    next = reconcileStealthBreakWhenNoConcealmentInCell(next, id, options)
  }
  return reconcileStealthHiddenForPerceivedObservers(next, options)
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

/**
 * **Reconciliation:** for each `hiddenFromObserverIds` entry, re-run {@link getHideAttemptEligibilityDenialReason}
 * (with {@link resolveHideEligibilityForCombatant} in **`stealth-sustain`** mode) and **remove** observers
 * who would now be denied a hide attempt — including when **observer-relative** terrain cover no longer
 * supports hide from that viewer. When the list becomes empty, clears stealth.
 *
 * **Fallback:** without a tactical grid, eligibility stays permissive (same as hide entry); pruning
 * then follows perception-only checks from {@link reconcileStealthHiddenForPerceivedObservers}.
 *
 * Used inside {@link reconcileStealthAfterMovementOrEnvironmentChange} — see docs/reference/stealth.md.
 */
export function reconcileStealthBreakWhenNoConcealmentInCell(
  state: EncounterState,
  hiderId: string,
  options?: StealthRulesOptions,
): EncounterState {
  const combatant = state.combatantsById[hiderId]
  const hidden = combatant?.stealth?.hiddenFromObserverIds
  if (!hidden?.length) return state

  const opts = hideEligibilityOpts(options)
  const cap = perceptionCapabilitiesOnly(options)
  const nextIds = hidden.filter((observerId) => {
    const denial = getHideAttemptEligibilityDenialReason(state, hiderId, observerId, {
      ...opts,
      ...cap,
      hideEligibilityResolveMode: 'stealth-sustain',
    })
    return denial === null
  })

  if (nextIds.length === hidden.length) return state
  if (nextIds.length === 0) return clearStealthForCombatant(state, hiderId)
  return updateEncounterCombatant(state, hiderId, (c) => ({
    ...c,
    stealth: { ...c.stealth!, hiddenFromObserverIds: nextIds },
  }))
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
