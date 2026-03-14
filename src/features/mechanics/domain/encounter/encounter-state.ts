import type { CombatLogEvent } from './combat-log.types'
import type { CombatantInstance, RuntimeMarker } from './combatant.types'
import { rollInitiative, type InitiativeResolverOptions } from './initiative-resolver'
import type { EncounterState } from './encounter.types'

function indexCombatants(combatants: CombatantInstance[]): Record<string, CombatantInstance> {
  return Object.fromEntries(combatants.map((combatant) => [combatant.instanceId, combatant]))
}

function createLogId(prefix: string, count: number): string {
  return `${prefix}_${count}`
}

function getCombatantLabel(state: EncounterState, combatantId: string | null): string {
  if (!combatantId) return 'Unknown combatant'
  return state.combatantsById[combatantId]?.source.label ?? combatantId
}

function createEncounterStartedLog(state: EncounterState): CombatLogEvent {
  return {
    id: createLogId('encounter_started', 1),
    timestamp: new Date().toISOString(),
    type: 'encounter_started',
    round: 1,
    turn: 1,
    summary: 'Encounter started.',
    details:
      state.initiative.length > 0
        ? `Initiative order: ${state.initiative
            .map((entry) => `${entry.label} (${entry.total})`)
            .join(', ')}`
        : 'No combatants added.',
  }
}

function createTurnStartedLog(state: EncounterState): CombatLogEvent {
  return {
    id: createLogId('turn_started', state.log.length + 1),
    timestamp: new Date().toISOString(),
    type: 'turn_started',
    actorId: state.activeCombatantId ?? undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, state.activeCombatantId)} starts their turn.`,
  }
}

function createTurnEndedLog(state: EncounterState): CombatLogEvent {
  return {
    id: createLogId('turn_ended', state.log.length + 1),
    timestamp: new Date().toISOString(),
    type: 'turn_ended',
    actorId: state.activeCombatantId ?? undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, state.activeCombatantId)} ends their turn.`,
  }
}

function createRoundStartedLog(state: EncounterState): CombatLogEvent {
  return {
    id: createLogId('round_started', state.log.length + 1),
    timestamp: new Date().toISOString(),
    type: 'round_started',
    round: state.roundNumber,
    turn: 1,
    summary: `Round ${state.roundNumber} starts.`,
  }
}

function appendLog(state: EncounterState, event: Omit<CombatLogEvent, 'id' | 'timestamp'>): EncounterState {
  return {
    ...state,
    log: [
      ...state.log,
      {
        ...event,
        id: createLogId(event.type, state.log.length + 1),
        timestamp: new Date().toISOString(),
      },
    ],
  }
}

function buildRuntimeMarker(label: string, options?: { durationTurns?: number; tickOn?: 'start' | 'end' }): RuntimeMarker {
  const durationTurns = options?.durationTurns
  if (!durationTurns || durationTurns <= 0) {
    return {
      id: label,
      label,
    }
  }

  return {
    id: label,
    label,
    duration: {
      remainingTurns: durationTurns,
      tickOn: options?.tickOn ?? 'end',
    },
  }
}

function markerMatches(marker: RuntimeMarker, label: string): boolean {
  return marker.label === label
}

function formatMarkerLabel(marker: RuntimeMarker): string {
  if (!marker.duration) return marker.label
  const suffix = `${marker.duration.remainingTurns} turn${marker.duration.remainingTurns === 1 ? '' : 's'} ${marker.duration.tickOn}`
  return `${marker.label} (${suffix})`
}

function tickMarkers(
  markers: RuntimeMarker[],
  boundary: 'start' | 'end',
): { nextMarkers: RuntimeMarker[]; expired: RuntimeMarker[] } {
  const nextMarkers: RuntimeMarker[] = []
  const expired: RuntimeMarker[] = []

  markers.forEach((marker) => {
    if (!marker.duration || marker.duration.tickOn !== boundary) {
      nextMarkers.push(marker)
      return
    }

    const remainingTurns = marker.duration.remainingTurns - 1
    if (remainingTurns <= 0) {
      expired.push(marker)
      return
    }

    nextMarkers.push({
      ...marker,
      duration: {
        ...marker.duration,
        remainingTurns,
      },
    })
  })

  return { nextMarkers, expired }
}

function processMarkerBoundary(
  state: EncounterState,
  combatantId: string | null,
  boundary: 'start' | 'end',
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  const conditionTick = tickMarkers(combatant.conditions, boundary)
  const stateTick = tickMarkers(combatant.states, boundary)
  const hasChanges = conditionTick.expired.length > 0 || stateTick.expired.length > 0

  const withTicks = hasChanges
    ? updateCombatant(state, combatantId, (current) => ({
        ...current,
        conditions: conditionTick.nextMarkers,
        states: stateTick.nextMarkers,
      }))
    : state

  let nextState = withTicks

  conditionTick.expired.forEach((marker) => {
    nextState = appendLog(nextState, {
      type: 'condition_removed',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} condition expires: ${marker.label}.`,
      details: `Expired at turn ${boundary}.`,
    })
  })

  stateTick.expired.forEach((marker) => {
    nextState = appendLog(nextState, {
      type: 'state_removed',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} state expires: ${marker.label}.`,
      details: `Expired at turn ${boundary}.`,
    })
  })

  return nextState
}

function updateCombatant(
  state: EncounterState,
  combatantId: string,
  updater: (combatant: CombatantInstance) => CombatantInstance,
): EncounterState {
  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  return {
    ...state,
    combatantsById: {
      ...state.combatantsById,
      [combatantId]: updater(combatant),
    },
  }
}

export function createEncounterState(
  combatants: CombatantInstance[],
  options: InitiativeResolverOptions = {},
): EncounterState {
  const initiative = rollInitiative(
    combatants.map((combatant) => ({
      instanceId: combatant.instanceId,
      label: combatant.source.label,
      initiativeModifier: combatant.stats.initiativeModifier,
      dexterityScore: combatant.stats.dexterityScore,
    })),
    options,
  )

  const initiativeOrder = initiative.map((entry) => entry.combatantId)
  const partyCombatantIds = combatants
    .filter((combatant) => combatant.side === 'party')
    .map((combatant) => combatant.instanceId)
  const enemyCombatantIds = combatants
    .filter((combatant) => combatant.side === 'enemies')
    .map((combatant) => combatant.instanceId)

  const state: EncounterState = {
    combatantsById: indexCombatants(combatants),
    partyCombatantIds,
    enemyCombatantIds,
    initiative,
    initiativeOrder,
    activeCombatantId: initiativeOrder[0] ?? null,
    turnIndex: 0,
    roundNumber: 1,
    started: true,
    log: [],
  }

  state.log = [createEncounterStartedLog(state)]
  if (state.activeCombatantId) {
    state.log.push(createTurnStartedLog(state))
  }

  return state
}

export function advanceEncounterTurn(state: EncounterState): EncounterState {
  if (!state.started || state.initiativeOrder.length === 0 || !state.activeCombatantId) {
    return state
  }

  const endedState = processMarkerBoundary(
    {
      ...state,
      log: [...state.log, createTurnEndedLog(state)],
    },
    state.activeCombatantId,
    'end',
  )

  const nextTurnIndex = (state.turnIndex + 1) % state.initiativeOrder.length
  const wrappedRound = nextTurnIndex === 0
  const nextRoundNumber = wrappedRound ? state.roundNumber + 1 : state.roundNumber

  let nextState: EncounterState = {
    ...endedState,
    turnIndex: nextTurnIndex,
    roundNumber: nextRoundNumber,
    activeCombatantId: state.initiativeOrder[nextTurnIndex] ?? null,
  }

  if (wrappedRound) {
    nextState = {
      ...nextState,
      log: [...nextState.log, createRoundStartedLog(nextState)],
    }
  }

  if (!nextState.activeCombatantId) {
    return nextState
  }

  const startedState: EncounterState = {
    ...nextState,
    log: [...nextState.log, createTurnStartedLog(nextState)],
  }

  return processMarkerBoundary(startedState, startedState.activeCombatantId, 'start')
}

export function applyDamageToCombatant(
  state: EncounterState,
  targetId: string,
  amount: number,
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target || amount <= 0) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    stats: {
      ...combatant.stats,
      currentHitPoints: Math.max(0, combatant.stats.currentHitPoints - amount),
    },
  }))

  return appendLog(nextState, {
    type: 'damage_applied',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} takes ${amount} damage.`,
  })
}

export function applyHealingToCombatant(
  state: EncounterState,
  targetId: string,
  amount: number,
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target || amount <= 0) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    stats: {
      ...combatant.stats,
      currentHitPoints: Math.min(
        combatant.stats.maxHitPoints,
        combatant.stats.currentHitPoints + amount,
      ),
    },
  }))

  return appendLog(nextState, {
    type: 'healing_applied',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} regains ${amount} hit points.`,
  })
}

export function addConditionToCombatant(
  state: EncounterState,
  targetId: string,
  condition: string,
  options?: { durationTurns?: number; tickOn?: 'start' | 'end' },
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
    type: 'condition_applied',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains condition: ${trimmedCondition}.`,
    details:
      options?.durationTurns && options.durationTurns > 0
        ? `Duration: ${options.durationTurns} turn(s), tick on ${options.tickOn ?? 'end'}.`
        : undefined,
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
    type: 'condition_removed',
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
  options?: { durationTurns?: number; tickOn?: 'start' | 'end' },
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
    type: 'state_applied',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains state: ${trimmedMarker}.`,
    details:
      options?.durationTurns && options.durationTurns > 0
        ? `Duration: ${options.durationTurns} turn(s), tick on ${options.tickOn ?? 'end'}.`
        : undefined,
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
    type: 'state_removed',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses state: ${trimmedMarker}.`,
  })
}

export { formatMarkerLabel }
