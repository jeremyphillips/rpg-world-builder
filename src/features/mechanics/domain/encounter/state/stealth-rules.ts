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

import { getCellForCombatant } from '@/features/encounter/space'
import { resolveWorldEnvironmentFromEncounterState } from '@/features/mechanics/domain/encounter/environment/environment.resolve'

import { getPassivePerceptionScore } from './passive-perception'
import { canPerceiveTargetOccupantForCombat } from './combatant-pair-visibility'
import { updateEncounterCombatant } from './mutations'
import {
  cellWorldSupportsHideConcealment,
  getHideAttemptEligibilityDenialReason,
  type HideAttemptEligibilityDenialReason,
} from './sight-hide-rules'
import type { CombatantStealthRuntime } from './types/combatant.types'
import type { EncounterState } from './types'
import type { EncounterViewerPerceptionCapabilities } from '../environment/perception.types'

export type StealthRulesOptions = {
  perceptionCapabilities?: EncounterViewerPerceptionCapabilities
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

function perceptionOpts(options?: StealthRulesOptions): { capabilities?: EncounterViewerPerceptionCapabilities } | undefined {
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
  return getHideAttemptEligibilityDenialReason(state, hiderId, observerId, perceptionOpts(options))
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
): EncounterState {
  const unique = [...new Set(observerIds)].filter((id) => id !== hiderId)
  if (unique.length === 0) return state

  return updateEncounterCombatant(state, hiderId, (c) => {
    const prev = c.stealth?.hiddenFromObserverIds ?? []
    const merged = [...new Set([...prev, ...unique])]
    const next: CombatantStealthRuntime = {
      ...c.stealth,
      hiddenFromObserverIds: merged,
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
 * perception seam.
 */
export function reconcileStealthHiddenForPerceivedObservers(
  state: EncounterState,
  options?: StealthRulesOptions,
): EncounterState {
  const cap = perceptionOpts(options)
  let next = state

  for (const combatant of Object.values(state.combatantsById)) {
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

  return next
}

/**
 * **Reconciliation:** if the hider’s cell no longer supports hide concealment (merged world), clear
 * stealth — leaving cover/obscurity that enabled hiding is treated as ending hidden state for this pass.
 *
 * Primary grid move path: `useEncounterState` `handleMoveCombatant` (after `moveCombatant`). Other
 * placement/mutation paths that change cell without going through that hook should call this (or full
 * stealth reconciliation) or hidden state may drift — see docs/reference/stealth.md.
 */
export function reconcileStealthBreakWhenNoConcealmentInCell(
  state: EncounterState,
  hiderId: string,
): EncounterState {
  if (!state.space || !state.placements) return state
  const cellId = getCellForCombatant(state.placements, hiderId)
  if (!cellId) return state
  const world = resolveWorldEnvironmentFromEncounterState(state, cellId)
  if (world == null) return state
  if (cellWorldSupportsHideConcealment(world)) return state
  return clearStealthForCombatant(state, hiderId)
}

function clearStealthForCombatant(state: EncounterState, combatantId: string): EncounterState {
  const c = state.combatantsById[combatantId]
  if (c == null || c.stealth == null) return state
  return updateEncounterCombatant(state, combatantId, ({ stealth: _s, ...rest }) => rest)
}

/**
 * **Baseline simplification (current pass):** clear the attacker’s stealth when they **make** an attack.
 * May later be refined (partial reveals per observer, features, “location revealed” only, spells).
 */
export function breakStealthOnAttack(state: EncounterState, attackerId: string): EncounterState {
  return clearStealthForCombatant(state, attackerId)
}

/** Whether `subjectId` is currently marked hidden from `observerId` (runtime bookkeeping only). */
export function isHiddenFromObserver(state: EncounterState, observerId: string, subjectId: string): boolean {
  return state.combatantsById[subjectId]?.stealth?.hiddenFromObserverIds.includes(observerId) ?? false
}
