/**
 * Diagnostic combat-log lines for stealth / `hiddenFromObserverIds` bookkeeping only.
 * Does not change stealth or perception rules — append-only notes on {@link EncounterState.log}.
 */
import { appendEncounterLogEvent, appendEncounterNote, getEncounterCombatantLabel } from '@/features/mechanics/domain/combat/state/effects/logging'
import type { EncounterState } from '@/features/mechanics/domain/combat/state/types'
import {
  formatPerceiveTargetOccupantBreakdownCompact,
  formatStealthRevealHumanReadable,
  type PerceiveTargetOccupantEvaluation,
} from '@/features/mechanics/domain/combat/state/visibility/combatant-pair-visibility'

/** `reason=` id is stable for filtering; other keys use display labels (see {@link getEncounterCombatantLabel}). */
export const STEALTH_DEBUG_REASON = {
  hideSuccess: 'hide-success',
  observerCanPerceiveTarget: 'observer-can-perceive-target',
  /**
   * Diagnostic only (combat log): pair hide world basis is gone vs this observer but they still cannot
   * perceive the occupant — does not reflect a stealth state change.
   */
  hideBasisLostContext: 'hide-basis-lost-context',
  movementReconcile: 'movement-reconcile',
  environmentChange: 'environment-change',
  attackBreak: 'attack-break',
  /** Pair perception step trace when hidden-from is pruned (same pipeline as canPerceiveTargetOccupantForCombat). */
  observerPerceivePruneBreakdown: 'observer-perceive-prune-breakdown',
} as const

function rosterLabels(state: EncounterState, ids: string[]): string {
  return ids.map((id) => getEncounterCombatantLabel(state, id)).join(', ')
}

/** Semicolon-separated key=value for log `details`; values are human-facing labels (not raw instance ids). */
function stealthNoteDetails(reason: string, fields: Record<string, string>): string {
  return [`reason=${reason}`, ...Object.entries(fields).map(([k, v]) => `${k}=${v}`)].join('; ')
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
    details: stealthNoteDetails(STEALTH_DEBUG_REASON.hideSuccess, {
      observers: rosterLabels(state, beatenObserverIds),
    }),
  })
}

/** Observer regained perception of the subject — hidden-from entry pruned. */
export function appendStealthPrunedObserverCanPerceiveNote(
  state: EncounterState,
  subjectId: string,
  removedObserverIds: string[],
  perceiveByObserverId?: Record<string, PerceiveTargetOccupantEvaluation>,
): EncounterState {
  if (removedObserverIds.length === 0) return state
  const subject = getEncounterCombatantLabel(state, subjectId)
  const names = rosterLabels(state, removedObserverIds)

  const summary = perceiveByObserverId
    ? removedObserverIds
        .map((oid) => {
          const ev = perceiveByObserverId[oid]
          const obs = getEncounterCombatantLabel(state, oid)
          if (!ev) return `${obs} can now perceive ${subject} (hidden-from removed).`
          return formatStealthRevealHumanReadable(obs, subject, ev.breakdown)
        })
        .join(' ')
    : `${names} can now perceive ${subject} (hidden-from removed).`

  const detailFields: Record<string, string> = {
    subject: getEncounterCombatantLabel(state, subjectId),
    observers: rosterLabels(state, removedObserverIds),
  }
  if (perceiveByObserverId) {
    detailFields.traceKind = STEALTH_DEBUG_REASON.observerPerceivePruneBreakdown
    detailFields.perceive = removedObserverIds
      .map((oid) => {
        const ev = perceiveByObserverId[oid]
        const obs = getEncounterCombatantLabel(state, oid)
        if (!ev) return `${obs}→(no evaluation)`
        return `${obs}→${formatPerceiveTargetOccupantBreakdownCompact(ev.breakdown)}`
      })
      .join(' || ')
    detailFields.perceiveIds = removedObserverIds
      .map((oid) => {
        const ev = perceiveByObserverId[oid]
        if (!ev) return `${oid}:missing`
        return `${oid}:${formatPerceiveTargetOccupantBreakdownCompact(ev.breakdown)}`
      })
      .join('||')
  }

  const structured = stealthNoteDetails(STEALTH_DEBUG_REASON.observerCanPerceiveTarget, detailFields)

  return appendEncounterLogEvent(state, {
    type: 'stealth-reveal',
    actorId: subjectId,
    targetIds: removedObserverIds,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary,
    /** User-facing modes: readable `summary` only; dense trace lives in {@link debugDetails}. */
    details: undefined,
    debugDetails: [structured],
  })
}

/** Diagnostic combat log: hide world basis gone for a new attempt vs these observers, but they still cannot perceive. */
export function appendStealthHideBasisLostContextNote(
  state: EncounterState,
  subjectId: string,
  observerIds: string[],
): EncounterState {
  if (observerIds.length === 0) return state
  const subject = getEncounterCombatantLabel(state, subjectId)
  const names = rosterLabels(state, observerIds)
  return appendEncounterNote(
    state,
    `${subject} still hidden from ${names}: hide basis for a new Hide attempt is gone, but those observers still cannot perceive them (sustained until seen or attack).`,
    {
      actorId: subjectId,
      targetIds: observerIds,
      details: stealthNoteDetails(STEALTH_DEBUG_REASON.hideBasisLostContext, {
        subject: getEncounterCombatantLabel(state, subjectId),
        observers: rosterLabels(state, observerIds),
      }),
    },
  )
}

/** Combatant moved on the grid; movement pipeline runs perception-based stealth reconcile next. */
export function appendStealthMovementRecheckHeaderNote(
  state: EncounterState,
  moverId: string,
  fromCellId: string,
  toCellId: string,
): EncounterState {
  const mover = getEncounterCombatantLabel(state, moverId)
  return appendEncounterNote(
    state,
    `${mover} moves ${fromCellId} → ${toCellId}. Hidden-from-observer state rechecked (perception-based reveal; hide basis may be noted as context when still unseen).`,
    {
      actorId: moverId,
      details: stealthNoteDetails(STEALTH_DEBUG_REASON.movementReconcile, {
        mover: getEncounterCombatantLabel(state, moverId),
        from: fromCellId,
        to: toCellId,
      }),
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
