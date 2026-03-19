import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type { EncounterState, RuntimeMarkerDuration } from './types'
import { buildRuntimeMarker, markerMatches, updateCombatant } from './shared'
import { appendLog, getCombatantLabel } from './logging'

export function addConditionToCombatant(
  state: EncounterState,
  targetId: string,
  condition: string,
  options?: {
    durationTurns?: number
    tickOn?: TurnBoundary
    duration?: RuntimeMarkerDuration
    sourceLabel?: string
    sourceInstanceId?: string
  },
): EncounterState {
  const trimmedCondition = condition.trim()
  const target = state.combatantsById[targetId]
  if (!target || trimmedCondition.length === 0 || target.conditions.some((entry) => markerMatches(entry, trimmedCondition))) {
    return state
  }

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    conditions: [...combatant.conditions, buildRuntimeMarker(trimmedCondition, options)],
  }))

  return appendLog(nextState, {
    type: 'condition-applied',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains condition: ${trimmedCondition}.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      options?.duration
        ? `Duration: ${options.duration.remainingTurns} turn(s), tick on ${options.duration.tickOn}.`
        : options?.durationTurns && options.durationTurns > 0
          ? `Duration: ${options.durationTurns} turn(s), tick on ${options.tickOn ?? 'end'}.`
          : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })
}

export function removeConditionFromCombatant(
  state: EncounterState,
  targetId: string,
  condition: string,
): EncounterState {
  const trimmedCondition = condition.trim()
  const target = state.combatantsById[targetId]
  if (!target || trimmedCondition.length === 0 || !target.conditions.some((entry) => markerMatches(entry, trimmedCondition))) {
    return state
  }

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    conditions: combatant.conditions.filter((entry) => !markerMatches(entry, trimmedCondition)),
  }))

  return appendLog(nextState, {
    type: 'condition-removed',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses condition: ${trimmedCondition}.`,
  })
}

export function addStateToCombatant(
  state: EncounterState,
  targetId: string,
  marker: string,
  options?: {
    durationTurns?: number
    tickOn?: TurnBoundary
    duration?: RuntimeMarkerDuration
    sourceLabel?: string
  },
): EncounterState {
  const trimmedMarker = marker.trim()
  const target = state.combatantsById[targetId]
  if (!target || trimmedMarker.length === 0 || target.states.some((entry) => markerMatches(entry, trimmedMarker))) {
    return state
  }

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    states: [...combatant.states, buildRuntimeMarker(trimmedMarker, options)],
  }))

  return appendLog(nextState, {
    type: 'state-applied',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains state: ${trimmedMarker}.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      options?.duration
        ? `Duration: ${options.duration.remainingTurns} turn(s), tick on ${options.duration.tickOn}.`
        : options?.durationTurns && options.durationTurns > 0
          ? `Duration: ${options.durationTurns} turn(s), tick on ${options.tickOn ?? 'end'}.`
          : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })
}

export function removeStateFromCombatant(
  state: EncounterState,
  targetId: string,
  marker: string,
): EncounterState {
  const trimmedMarker = marker.trim()
  const target = state.combatantsById[targetId]
  if (!target || trimmedMarker.length === 0 || !target.states.some((entry) => markerMatches(entry, trimmedMarker))) {
    return state
  }

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    states: combatant.states.filter((entry) => !markerMatches(entry, trimmedMarker)),
  }))

  return appendLog(nextState, {
    type: 'state-removed',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses state: ${trimmedMarker}.`,
  })
}
