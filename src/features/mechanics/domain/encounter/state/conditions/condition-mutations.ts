import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import { isImmuneToConditionIncludingScopedGrants } from './condition-immunity-resolution'
import type { EncounterState, RuntimeMarkerDuration } from '../types'
import {
  applyBattlefieldAbsenceOnEngineStateAdded,
  maybeRestoreBattlefieldPlacement,
} from '../battlefield/battlefield-return-placement'
import { buildRuntimeMarker, markerMatches, updateCombatant } from '../shared'
import { appendLog, getCombatantLabel } from '../effects/logging'
import { formatConditionConsequencesDebug } from '../../resolution/action/resolution-debug'

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
    classification?: string[]
  },
): EncounterState {
  const trimmedCondition = condition.trim()
  const target = state.combatantsById[targetId]
  if (!target || trimmedCondition.length === 0 || target.conditions.some((entry) => markerMatches(entry, trimmedCondition))) {
    return state
  }

  const applyingSource = options?.sourceInstanceId
    ? state.combatantsById[options.sourceInstanceId]
    : undefined
  if (isImmuneToConditionIncludingScopedGrants(target, trimmedCondition, applyingSource)) {
    return appendLog(state, {
      type: 'note',
      actorId: state.activeCombatantId ?? undefined,
      targetIds: [targetId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${getCombatantLabel(state, targetId)} is immune to condition: ${trimmedCondition}.`,
      details: options?.sourceLabel ? `Source: ${options.sourceLabel}.` : undefined,
    })
  }

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    conditions: [...combatant.conditions, buildRuntimeMarker(trimmedCondition, options)],
  }))

  const condDebug = formatConditionConsequencesDebug(trimmedCondition)
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
    debugDetails: condDebug.length > 0 ? condDebug : undefined,
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
    classification?: string[]
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

  const withPlacement = applyBattlefieldAbsenceOnEngineStateAdded(nextState, targetId, trimmedMarker)

  return appendLog(withPlacement, {
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

  const restored = maybeRestoreBattlefieldPlacement(nextState, targetId)

  return appendLog(restored, {
    type: 'state-removed',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses state: ${trimmedMarker}.`,
  })
}

export function removeStatesByClassification(
  state: EncounterState,
  targetId: string,
  classification: string,
  options?: { sourceLabel?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  const matching = target.states.filter(
    (s) => s.classification?.includes(classification),
  )
  if (matching.length === 0) return state

  const matchingIds = new Set(matching.map((s) => s.id))

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    states: combatant.states.filter((s) => !matchingIds.has(s.id)),
    turnHooks: combatant.turnHooks.filter(
      (h) => !matching.some((s) => h.id.includes(s.id)),
    ),
  }))

  let result = maybeRestoreBattlefieldPlacement(nextState, targetId)

  for (const marker of matching) {
    result = appendLog(result, {
      type: 'state-removed',
      actorId: state.activeCombatantId ?? undefined,
      targetIds: [targetId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${getCombatantLabel(state, targetId)} loses state: ${marker.label} (${classification} removed).`,
      details: options?.sourceLabel ? `Source: ${options.sourceLabel}.` : undefined,
    })
  }

  return result
}
