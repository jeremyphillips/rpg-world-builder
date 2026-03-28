/**
 * Diagnostic combat-log lines for stealth / `hiddenFromObserverIds` bookkeeping only.
 * Does not change stealth or perception rules — append-only notes on {@link EncounterState.log}.
 */
import { appendEncounterNote, getEncounterCombatantLabel } from '../effects/logging'
import type { EncounterState } from '../types'

/** Machine-readable reason ids in `details` (semicolon-separated key=value). */
export const STEALTH_DEBUG_REASON = {
  hideSuccess: 'hide-success',
  observerCanPerceiveTarget: 'observer-can-perceive-target',
  lostHideBasis: 'lost-hide-basis',
  movementReconcile: 'movement-reconcile',
  environmentChange: 'environment-change',
  attackBreak: 'attack-break',
} as const

function rosterLabels(state: EncounterState, ids: string[]): string {
  return ids.map((id) => getEncounterCombatantLabel(state, id)).join(', ')
}

/** After a successful Hide vs passive Perception, when at least one observer is beaten. */
export function appendStealthHideSuccessAppliedNote(
  state: EncounterState,
  hiderId: string,
  beatenObserverIds: string[],
): EncounterState {
  if (beatenObserverIds.length === 0) return state
  const hider = getEncounterCombatantLabel(state, hiderId)
  const observers = rosterLabels(state, beatenObserverIds)
  return appendEncounterNote(state, `${hider} is hidden from: ${observers}.`, {
    actorId: hiderId,
    targetIds: beatenObserverIds,
    details: `reason=${STEALTH_DEBUG_REASON.hideSuccess}; observers=${beatenObserverIds.join(',')}`,
  })
}

/** Observer regained perception of the subject — hidden-from entry pruned. */
export function appendStealthPrunedObserverCanPerceiveNote(
  state: EncounterState,
  subjectId: string,
  removedObserverIds: string[],
): EncounterState {
  if (removedObserverIds.length === 0) return state
  const subject = getEncounterCombatantLabel(state, subjectId)
  const names = rosterLabels(state, removedObserverIds)
  return appendEncounterNote(
    state,
    `${subject} revealed to ${names} (observer can perceive target — hidden-from list pruned).`,
    {
      actorId: subjectId,
      targetIds: removedObserverIds,
      details: `reason=${STEALTH_DEBUG_REASON.observerCanPerceiveTarget}; subject=${subjectId}; observers=${removedObserverIds.join(',')}`,
    },
  )
}

/** Hide eligibility / concealment basis no longer supports hiding from that observer. */
export function appendStealthPrunedLostHideBasisNote(
  state: EncounterState,
  subjectId: string,
  removedObserverIds: string[],
): EncounterState {
  if (removedObserverIds.length === 0) return state
  const subject = getEncounterCombatantLabel(state, subjectId)
  const names = rosterLabels(state, removedObserverIds)
  return appendEncounterNote(
    state,
    `${subject} no longer hidden from ${names} (lost hide basis — cover/concealment vs observer).`,
    {
      actorId: subjectId,
      targetIds: removedObserverIds,
      details: `reason=${STEALTH_DEBUG_REASON.lostHideBasis}; subject=${subjectId}; observers=${removedObserverIds.join(',')}`,
    },
  )
}

/** Combatant moved on the grid; stealth reconciliation (cover + perception) runs next in the pipeline. */
export function appendStealthMovementRecheckHeaderNote(
  state: EncounterState,
  moverId: string,
  fromCellId: string,
  toCellId: string,
): EncounterState {
  const mover = getEncounterCombatantLabel(state, moverId)
  return appendEncounterNote(
    state,
    `${mover} moves ${fromCellId} → ${toCellId}. Hidden-from-observer state rechecked (cover + perception).`,
    {
      actorId: moverId,
      details: `reason=${STEALTH_DEBUG_REASON.movementReconcile}; mover=${moverId}; from=${fromCellId}; to=${toCellId}`,
    },
  )
}

/** Attacker resolved an attack roll — global stealth cleared. */
export function appendStealthBrokenOnAttackNote(state: EncounterState, attackerId: string): EncounterState {
  const attacker = getEncounterCombatantLabel(state, attackerId)
  return appendEncounterNote(state, `${attacker} stealth ends (attack).`, {
    actorId: attackerId,
    details: `reason=${STEALTH_DEBUG_REASON.attackBreak}`,
  })
}
