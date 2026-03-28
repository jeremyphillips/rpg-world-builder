import type { EncounterState, CombatLogEvent } from '../types'
import { formatCombatantStatusSnapshot, formatConcentrationTimer } from '../../resolution/action/resolution-debug'
import { getCombatantDisplayLabel } from '../combatants/combatant-display-label'

/** Maximum combat log entries to prevent unbounded memory growth during long encounters. */
const MAX_LOG_ENTRIES = 500

function createLogId(prefix: string, count: number): string {
  return `${prefix}_${count}`
}

export function getCombatantLabel(state: EncounterState, combatantId: string | null): string {
  if (!combatantId) return 'Unknown combatant'
  const c = state.combatantsById[combatantId]
  if (!c) return combatantId
  return getCombatantDisplayLabel(c, Object.values(state.combatantsById))
}

function formatInitiativeOrderDetails(state: EncounterState): string {
  if (state.initiative.length === 0) return 'No combatants added.'
  const roster = Object.values(state.combatantsById)
  return `Initiative order: ${state.initiative
    .map((entry) => {
      const c = state.combatantsById[entry.combatantId]
      const label = c ? getCombatantDisplayLabel(c, roster) : entry.label
      return `${label} (${entry.total})`
    })
    .join(', ')}`
}

export function createEncounterStartedLog(state: EncounterState): CombatLogEvent {
  return {
    id: createLogId('encounter-started', 1),
    timestamp: new Date().toISOString(),
    type: 'encounter-started',
    round: 1,
    turn: 1,
    summary: 'Encounter started.',
    details: state.initiative.length > 0 ? formatInitiativeOrderDetails(state) : 'No combatants added.',
  }
}

export function createTurnStartedLog(state: EncounterState): CombatLogEvent {
  const combatant = state.activeCombatantId ? state.combatantsById[state.activeCombatantId] : undefined
  const snapshot = combatant ? formatCombatantStatusSnapshot(combatant) : []
  return {
    id: createLogId('turn-started', state.log.length + 1),
    timestamp: new Date().toISOString(),
    type: 'turn-started',
    actorId: state.activeCombatantId ?? undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, state.activeCombatantId)} starts their turn.`,
    debugDetails: snapshot.length > 0 ? snapshot : undefined,
  }
}

export function createTurnEndedLog(state: EncounterState): CombatLogEvent {
  const combatant = state.activeCombatantId ? state.combatantsById[state.activeCombatantId] : undefined
  const concLine = combatant ? formatConcentrationTimer(combatant) : null
  return {
    id: createLogId('turn-ended', state.log.length + 1),
    timestamp: new Date().toISOString(),
    type: 'turn-ended',
    actorId: state.activeCombatantId ?? undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, state.activeCombatantId)} ends their turn.`,
    debugDetails: concLine ? [concLine] : undefined,
  }
}

export function createRoundStartedLog(state: EncounterState): CombatLogEvent {
  return {
    id: createLogId('round-started', state.log.length + 1),
    timestamp: new Date().toISOString(),
    type: 'round-started',
    round: state.roundNumber,
    turn: 1,
    summary: `Round ${state.roundNumber} starts.`,
    details: state.initiative.length > 0 ? formatInitiativeOrderDetails(state) : undefined,
  }
}

export function appendLog(
  state: EncounterState,
  event: Omit<CombatLogEvent, 'id' | 'timestamp'>,
): EncounterState {
  const newEntry: CombatLogEvent = {
    ...event,
    id: createLogId(event.type, state.log.length + 1),
    timestamp: new Date().toISOString(),
  }
  const nextLog = [...state.log, newEntry]
  const cappedLog = nextLog.length > MAX_LOG_ENTRIES ? nextLog.slice(-MAX_LOG_ENTRIES) : nextLog
  return {
    ...state,
    log: cappedLog,
  }
}

export function appendEncounterNote(
  state: EncounterState,
  summary: string,
  options?: {
    actorId?: string
    targetIds?: string[]
    details?: string
    debugDetails?: string[]
  },
): EncounterState {
  return appendLog(state, {
    type: 'note',
    actorId: options?.actorId,
    targetIds: options?.targetIds,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary,
    details: options?.details,
    debugDetails: options?.debugDetails,
  })
}

export function appendEncounterLogEvent(
  state: EncounterState,
  event: Omit<CombatLogEvent, 'id' | 'timestamp'>,
): EncounterState {
  return appendLog(state, event)
}

export function getEncounterCombatantLabel(state: EncounterState, combatantId: string | null): string {
  return getCombatantLabel(state, combatantId)
}

export function appendHookTriggeredLog(
  state: EncounterState,
  combatantId: string,
  hookLabel: string,
  details?: string,
  debugDetails?: string[],
): EncounterState {
  return appendLog(state, {
    type: 'hook-triggered',
    actorId: combatantId,
    targetIds: [combatantId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, combatantId)} hook fires: ${hookLabel}.`,
    details,
    debugDetails,
  })
}
