import type { CombatLogEvent } from './combat-log.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type {
  CombatantInstance,
  CombatantTurnContext,
  CombatantTurnResources,
  RuntimeEffectInstance,
  RuntimeMarker,
  RuntimeMarkerDuration,
  RuntimeTrackedPart,
  RuntimeTurnHook,
  RuntimeTurnHookRequirement,
} from './combatant.types'
import { createCombatTurnResources } from './combatant.types'
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

function buildRuntimeMarker(label: string, options?: {
  durationTurns?: number
  tickOn?: 'start' | 'end'
  duration?: RuntimeMarkerDuration
}): RuntimeMarker {
  const duration = options?.duration
  const durationTurns = options?.durationTurns
  if (duration) {
    return {
      id: label,
      label,
      duration,
    }
  }

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

function formatEffectLabel(effect: Effect): string {
  switch (effect.kind) {
    case 'condition':
      return `Condition: ${effect.conditionId}`
    case 'state':
      return `State: ${effect.stateId}`
    case 'immunity':
      return effect.notes ?? 'Immunity effect'
    case 'hold_breath':
      return 'Hold Breath'
    default:
      return effect.text ?? effect.kind.replaceAll('_', ' ')
  }
}

function effectDurationToRuntimeDuration(effect: Effect): RuntimeMarkerDuration | null {
  const duration = effect.duration
  if (!duration) return null

  if (duration.kind === 'until_turn_boundary') {
    return {
      remainingTurns: duration.turn === 'current' ? 0 : 1,
      tickOn: duration.boundary,
    }
  }

  if (duration.kind === 'fixed' && duration.unit === 'turn' && duration.value > 0) {
    return {
      remainingTurns: duration.value,
      tickOn: 'end',
    }
  }

  return null
}

function deriveRuntimeEffects(combatant: CombatantInstance): RuntimeEffectInstance[] {
  return combatant.activeEffects.flatMap((effect, index) => {
    const duration = effectDurationToRuntimeDuration(effect)
    if (!duration || duration.remainingTurns <= 0) return []

    return [
      {
        id: `${combatant.instanceId}-effect-${index}`,
        label: formatEffectLabel(effect),
        effectKind: effect.kind,
        duration,
      },
    ]
  })
}

function seedRuntimeEffects(combatant: CombatantInstance): CombatantInstance {
  return {
    ...combatant,
    actions: combatant.actions ?? [],
    trackedParts: combatant.trackedParts ?? deriveTrackedParts(combatant),
    turnResources: combatant.turnResources ?? createCombatantTurnResources(combatant),
    runtimeEffects:
      combatant.runtimeEffects.length > 0 ? combatant.runtimeEffects : deriveRuntimeEffects(combatant),
  }
}

function deriveTrackedParts(combatant: CombatantInstance): RuntimeTrackedPart[] {
  return combatant.activeEffects.flatMap((effect) => {
    if (effect.kind !== 'tracked_part' || !('initialCount' in effect)) return []

    return [
      {
        part: effect.part,
        currentCount: effect.initialCount,
        initialCount: effect.initialCount,
        lostSinceLastTurn: 0,
        lossAppliedThisTurn: 0,
        damageTakenThisTurn: 0,
        damageTakenByTypeThisTurn: {},
        regrowthSuppressedByDamageTypes: [],
        loss: effect.loss,
        deathWhenCountReaches: effect.deathWhenCountReaches,
        regrowth: effect.regrowth,
      },
    ]
  })
}

function formatRuntimeEffectLabel(effect: RuntimeEffectInstance): string {
  const suffix = `${effect.duration.remainingTurns} turn${effect.duration.remainingTurns === 1 ? '' : 's'} ${effect.duration.tickOn}`
  return `${effect.label} (${suffix})`
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

function tickRuntimeEffects(
  runtimeEffects: RuntimeEffectInstance[],
  boundary: 'start' | 'end',
): { nextEffects: RuntimeEffectInstance[]; expired: RuntimeEffectInstance[] } {
  const nextEffects: RuntimeEffectInstance[] = []
  const expired: RuntimeEffectInstance[] = []

  runtimeEffects.forEach((effect) => {
    if (effect.duration.tickOn !== boundary) {
      nextEffects.push(effect)
      return
    }

    const remainingTurns = effect.duration.remainingTurns - 1
    if (remainingTurns <= 0) {
      expired.push(effect)
      return
    }

    nextEffects.push({
      ...effect,
      duration: {
        ...effect.duration,
        remainingTurns,
      },
    })
  })

  return { nextEffects, expired }
}

function createEmptyTurnContext(): CombatantTurnContext {
  return {
    totalDamageTaken: 0,
    damageTakenByType: {},
  }
}

function getCombatantBaseMovement(combatant: CombatantInstance): number {
  const speeds = Object.values(combatant.stats.speeds ?? {}).filter(
    (speed): speed is number => typeof speed === 'number' && speed > 0
  )
  return speeds.length > 0 ? Math.max(...speeds) : 0
}

function createCombatantTurnResources(combatant: CombatantInstance): CombatantTurnResources {
  return createCombatTurnResources(getCombatantBaseMovement(combatant))
}

function normalizeDamageType(damageType?: string): string | null {
  const trimmed = damageType?.trim().toLowerCase()
  return trimmed ? trimmed : null
}

function getTurnKey(state: EncounterState): string {
  return `${state.roundNumber}:${state.turnIndex + 1}`
}

function requirementLabel(requirement: RuntimeTurnHookRequirement): string {
  switch (requirement.kind) {
    case 'self-state':
      return requirement.state
    case 'damage-taken-this-turn':
      if (requirement.damageType && requirement.min) {
        return `${requirement.min}+ ${requirement.damageType} damage taken this turn`
      }
      if (requirement.damageType) {
        return `${requirement.damageType} damage taken this turn`
      }
      if (requirement.min) {
        return `${requirement.min}+ damage taken this turn`
      }
      return 'damage taken this turn'
    case 'hit-points-equals':
      return `hit points equal ${requirement.value}`
  }
}

function requirementMet(combatant: CombatantInstance, requirement: RuntimeTurnHookRequirement): boolean {
  switch (requirement.kind) {
    case 'self-state':
      return requirement.state === 'bloodied'
        ? combatant.stats.currentHitPoints <= combatant.stats.maxHitPoints / 2
        : false
    case 'hit-points-equals':
      return combatant.stats.currentHitPoints === requirement.value
    case 'damage-taken-this-turn': {
      const turnContext = combatant.turnContext ?? createEmptyTurnContext()
      const damageAmount = requirement.damageType
        ? turnContext.damageTakenByType[normalizeDamageType(requirement.damageType) ?? ''] ?? 0
        : turnContext.totalDamageTaken
      return damageAmount >= (requirement.min ?? 1)
    }
  }
}

function unmetHookRequirements(combatant: CombatantInstance, hook: RuntimeTurnHook): RuntimeTurnHookRequirement[] {
  return (hook.requirements ?? []).filter((requirement) => !requirementMet(combatant, requirement))
}

function formatTurnHookNote(effect: Effect): string | null {
  switch (effect.kind) {
    case 'tracked_part': {
      const change = 'change' in effect ? effect.change : undefined
      if (change) {
        const verb = change.mode === 'sever' ? 'Sever' : 'Grow'
        return `${verb} ${change.count} ${effect.part}${change.count === 1 ? '' : 's'}.`
      }
      return `Track ${effect.part} count.`
    }
    case 'spawn':
      return `Spawn ${effect.count} ${effect.creature}${effect.count === 1 ? '' : 's'} at ${effect.location}.`
    case 'custom':
      return effect.text ?? `Custom effect: ${effect.id}.`
    case 'note':
      return effect.text
    default:
      return null
  }
}

function processTrackedPartTurnEnd(
  state: EncounterState,
  combatantId: string | null,
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant || (combatant.trackedParts?.length ?? 0) === 0) return state

  const trackedParts = combatant.trackedParts ?? []
  const updatedTrackedParts = trackedParts.map((trackedPart) => {
    if (trackedPart.regrowth?.trigger !== 'turn_end') {
      return {
        ...trackedPart,
        lostSinceLastTurn: 0,
        regrowthSuppressedByDamageTypes: [],
      }
    }

    const isSuppressed =
      trackedPart.regrowth.suppressedByDamageTypes?.some((damageType) =>
        trackedPart.regrowthSuppressedByDamageTypes.includes(normalizeDamageType(damageType) ?? '')
      ) ?? false
    const canRegrow =
      trackedPart.lostSinceLastTurn > 0 &&
      !isSuppressed &&
      (!trackedPart.regrowth.requiresLivingPart || trackedPart.currentCount > 0)
    const regrowthCount = canRegrow
      ? trackedPart.lostSinceLastTurn * trackedPart.regrowth.countPerPartLostSinceLastTurn
      : 0

    return {
      ...trackedPart,
      currentCount: trackedPart.currentCount + regrowthCount,
      lostSinceLastTurn: 0,
      regrowthSuppressedByDamageTypes: [],
    }
  })

  let nextState = updateCombatant(state, combatantId, (current) => ({
    ...current,
    trackedParts: updatedTrackedParts,
  }))

  trackedParts.forEach((trackedPart, index) => {
    const nextTrackedPart = updatedTrackedParts[index]
    if (!nextTrackedPart) return

    const regrowthCount = nextTrackedPart.currentCount - trackedPart.currentCount
    if (regrowthCount > 0) {
      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${getCombatantLabel(nextState, combatantId)} grows ${regrowthCount} ${trackedPart.part}${regrowthCount === 1 ? '' : 's'}.`,
      })

      if (trackedPart.regrowth?.healHitPoints) {
        nextState = applyHealingToCombatant(nextState, combatantId, trackedPart.regrowth.healHitPoints, {
          actorId: combatantId,
          sourceLabel: `${trackedPart.part} regrowth`,
        })
      }
    } else if (trackedPart.lostSinceLastTurn > 0 && trackedPart.regrowthSuppressedByDamageTypes.length > 0) {
      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${getCombatantLabel(nextState, combatantId)} cannot regrow ${trackedPart.part}s this turn.`,
        details: `Suppressed by ${trackedPart.regrowthSuppressedByDamageTypes.join(', ')} damage.`,
      })
    }
  })

  return nextState
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
  const suppressionTick = tickMarkers(combatant.suppressedHooks ?? [], boundary)
  const hasChanges =
    conditionTick.expired.length > 0 ||
    stateTick.expired.length > 0 ||
    suppressionTick.expired.length > 0

  const withTicks = hasChanges
    ? updateCombatant(state, combatantId, (current) => ({
        ...current,
        conditions: conditionTick.nextMarkers,
        states: stateTick.nextMarkers,
        suppressedHooks: suppressionTick.nextMarkers,
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

  suppressionTick.expired.forEach((marker) => {
    nextState = appendLog(nextState, {
      type: 'note',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} hook suppression ends: ${marker.label}.`,
      details: `Expired at turn ${boundary}.`,
    })
  })

  return nextState
}

function processRuntimeEffectBoundary(
  state: EncounterState,
  combatantId: string | null,
  boundary: 'start' | 'end',
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  const effectTick = tickRuntimeEffects(combatant.runtimeEffects, boundary)
  if (effectTick.expired.length === 0) return state

  let nextState = updateCombatant(state, combatantId, (current) => ({
    ...current,
    runtimeEffects: effectTick.nextEffects,
  }))

  effectTick.expired.forEach((effect) => {
    nextState = appendLog(nextState, {
      type: 'effect_expired',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} effect expires: ${effect.label}.`,
      details: `Expired at turn ${boundary}.`,
    })
  })

  return nextState
}

function executeTurnHooks(
  state: EncounterState,
  combatantId: string | null,
  boundary: 'start' | 'end',
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  const hooks = combatant.turnHooks.filter((hook) => hook.boundary === boundary)
  if (hooks.length === 0) return state

  let nextState = state

  hooks.forEach((hook) => {
    if ((combatant.suppressedHooks ?? []).some((marker) => marker.id === hook.id)) {
      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${getCombatantLabel(nextState, combatantId)} hook is suppressed: ${hook.label}.`,
        details: `${boundary} of turn.`,
      })
      return
    }

    const unmetRequirements = unmetHookRequirements(combatant, hook)
    if (unmetRequirements.length > 0) {
      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${getCombatantLabel(nextState, combatantId)} hook requirements not met: ${hook.label}.`,
        details: unmetRequirements.map(requirementLabel).join(', '),
      })
      return
    }

    nextState = appendLog(nextState, {
      type: 'hook_triggered',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} hook fires: ${hook.label}.`,
      details: `${boundary} of turn.`,
    })

    hook.effects.forEach((effect) => {
      if (effect.kind === 'hit_points') {
        nextState =
          effect.mode === 'heal'
            ? applyHealingToCombatant(nextState, combatantId, effect.value, {
                actorId: combatantId,
                sourceLabel: hook.label,
              })
            : applyDamageToCombatant(nextState, combatantId, effect.value, {
                actorId: combatantId,
                sourceLabel: hook.label,
              })
        return
      }

      if (effect.kind === 'condition') {
        nextState = addConditionToCombatant(nextState, combatantId, effect.conditionId, {
          duration: effectDurationToRuntimeDuration(effect) ?? undefined,
          sourceLabel: hook.label,
        })
        return
      }

      if (effect.kind === 'state') {
        nextState = addStateToCombatant(nextState, combatantId, effect.stateId, {
          duration: effectDurationToRuntimeDuration(effect) ?? undefined,
          sourceLabel: hook.label,
        })
        return
      }

      const turnHookNote = formatTurnHookNote(effect)
      if (turnHookNote) {
        nextState = appendLog(nextState, {
          type: 'note',
          actorId: combatantId,
          targetIds: [combatantId],
          round: nextState.roundNumber,
          turn: nextState.turnIndex + 1,
          summary: `${hook.label}: ${turnHookNote}`,
        })
        return
      }

      nextState = appendLog(nextState, {
        type: 'note',
        actorId: combatantId,
        targetIds: [combatantId],
        round: nextState.roundNumber,
        turn: nextState.turnIndex + 1,
        summary: `${hook.label} has unsupported runtime effect: ${effect.kind}.`,
      })
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

function resetCombatantTurnState(state: EncounterState, combatantId: string | null): EncounterState {
  if (!combatantId) return state

  return updateCombatant(state, combatantId, (combatant) => ({
    ...combatant,
    turnContext: createEmptyTurnContext(),
    turnResources: createCombatantTurnResources(combatant),
  }))
}

export function createEncounterState(
  combatants: CombatantInstance[],
  options: InitiativeResolverOptions = {},
): EncounterState {
  const seededCombatants = combatants.map(seedRuntimeEffects)
  const initiative = rollInitiative(
    seededCombatants.map((combatant) => ({
      instanceId: combatant.instanceId,
      label: combatant.source.label,
      initiativeModifier: combatant.stats.initiativeModifier,
      dexterityScore: combatant.stats.dexterityScore,
    })),
    options,
  )

  const initiativeOrder = initiative.map((entry) => entry.combatantId)
  const partyCombatantIds = seededCombatants
    .filter((combatant) => combatant.side === 'party')
    .map((combatant) => combatant.instanceId)
  const enemyCombatantIds = seededCombatants
    .filter((combatant) => combatant.side === 'enemies')
    .map((combatant) => combatant.instanceId)

  const state: EncounterState = {
    combatantsById: indexCombatants(seededCombatants),
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
    const withResetContext = resetCombatantTurnState(state, state.activeCombatantId)
    const withStartExpiry = processRuntimeEffectBoundary(withResetContext, state.activeCombatantId, 'start')
    const withMarkerExpiry = processMarkerBoundary(withStartExpiry, state.activeCombatantId, 'start')
    return executeTurnHooks(withMarkerExpiry, state.activeCombatantId, 'start')
  }

  return state
}

export function advanceEncounterTurn(state: EncounterState): EncounterState {
  if (!state.started || state.initiativeOrder.length === 0 || !state.activeCombatantId) {
    return state
  }

  const withTurnEndLog: EncounterState = {
    ...state,
    log: [...state.log, createTurnEndedLog(state)],
  }
  const endedState = processMarkerBoundary(
    processRuntimeEffectBoundary(
      processTrackedPartTurnEnd(
        executeTurnHooks(withTurnEndLog, state.activeCombatantId, 'end'),
        state.activeCombatantId,
      ),
      state.activeCombatantId,
      'end',
    ),
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

  const withResetContext = resetCombatantTurnState(startedState, startedState.activeCombatantId)

  return executeTurnHooks(
    processMarkerBoundary(
      processRuntimeEffectBoundary(withResetContext, withResetContext.activeCombatantId, 'start'),
      withResetContext.activeCombatantId,
      'start',
    ),
    withResetContext.activeCombatantId,
    'start',
  )
}

export function applyDamageToCombatant(
  state: EncounterState,
  targetId: string,
  amount: number,
  options?: { actorId?: string | null; sourceLabel?: string; damageType?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target || amount <= 0) return state

  const turnKey = getTurnKey(state)

  const nextState = updateCombatant(state, targetId, (combatant) => {
    const normalizedDamageType = normalizeDamageType(options?.damageType)
    const currentTurnContext = combatant.turnContext ?? createEmptyTurnContext()
    const existingSuppressedHooks = combatant.suppressedHooks ?? []
    const suppressedHooks =
      normalizedDamageType == null
        ? existingSuppressedHooks
        : combatant.turnHooks.reduce<RuntimeMarker[]>((markers, hook) => {
            const matchesDamageType = hook.suppression?.damageTypes?.some(
              (damageType) => normalizeDamageType(damageType) === normalizedDamageType,
            )
            const alreadySuppressed = existingSuppressedHooks.some((marker) => marker.id === hook.id)

            if (!matchesDamageType || alreadySuppressed) return markers

            return [
              ...markers,
              {
                ...buildRuntimeMarker(hook.label, {
                  duration: hook.suppression?.duration,
                }),
                id: hook.id,
              },
            ]
          }, existingSuppressedHooks)
    const trackedParts = (combatant.trackedParts ?? []).map((trackedPart) => {
      const resetsForNewTurn = trackedPart.damageWindowTurnKey !== turnKey
      const baseDamageTakenThisTurn = resetsForNewTurn ? 0 : trackedPart.damageTakenThisTurn
      const baseDamageTakenByTypeThisTurn = resetsForNewTurn ? {} : trackedPart.damageTakenByTypeThisTurn
      const baseLossAppliedThisTurn = resetsForNewTurn ? 0 : trackedPart.lossAppliedThisTurn
      const damageTakenThisTurn = baseDamageTakenThisTurn + amount
      const damageTakenByTypeThisTurn =
        normalizedDamageType == null
          ? baseDamageTakenByTypeThisTurn
          : {
              ...baseDamageTakenByTypeThisTurn,
              [normalizedDamageType]:
                (baseDamageTakenByTypeThisTurn[normalizedDamageType] ?? 0) + amount,
            }
      const thresholdCrossings =
        trackedPart.loss?.trigger === 'damage_taken_in_single_turn'
          ? Math.floor(damageTakenThisTurn / trackedPart.loss.minDamage) * trackedPart.loss.count
          : 0
      const newLossCount = Math.max(0, thresholdCrossings - baseLossAppliedThisTurn)
      const regrowthSuppressedByDamageTypes =
        normalizedDamageType == null
          ? trackedPart.regrowthSuppressedByDamageTypes
          : trackedPart.regrowth?.suppressedByDamageTypes?.some(
                (damageType) => normalizeDamageType(damageType) === normalizedDamageType,
              )
            ? Array.from(new Set([...trackedPart.regrowthSuppressedByDamageTypes, normalizedDamageType]))
            : trackedPart.regrowthSuppressedByDamageTypes

      return {
        ...trackedPart,
        currentCount: Math.max(0, trackedPart.currentCount - newLossCount),
        lostSinceLastTurn: trackedPart.lostSinceLastTurn + newLossCount,
        lossAppliedThisTurn: baseLossAppliedThisTurn + newLossCount,
        damageWindowTurnKey: turnKey,
        damageTakenThisTurn,
        damageTakenByTypeThisTurn,
        regrowthSuppressedByDamageTypes,
      }
    })
    const fatalTrackedPart = trackedParts.find(
      (trackedPart) =>
        trackedPart.deathWhenCountReaches != null &&
        trackedPart.currentCount <= trackedPart.deathWhenCountReaches,
    )

    return {
      ...combatant,
      stats: {
        ...combatant.stats,
        currentHitPoints: fatalTrackedPart
          ? 0
          : Math.max(0, combatant.stats.currentHitPoints - amount),
      },
      trackedParts,
      suppressedHooks,
      turnContext: {
        totalDamageTaken: currentTurnContext.totalDamageTaken + amount,
        damageTakenByType:
          normalizedDamageType == null
            ? currentTurnContext.damageTakenByType
            : {
                ...currentTurnContext.damageTakenByType,
                [normalizedDamageType]:
                  (currentTurnContext.damageTakenByType[normalizedDamageType] ?? 0) + amount,
              },
      },
    }
  })

  let loggedState = appendLog(nextState, {
    type: 'damage_applied',
    actorId: options?.actorId ?? state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} takes ${amount} damage.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      options?.damageType ? `Damage type: ${options.damageType}.` : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })

  const previousTrackedParts = target.trackedParts ?? []
  const nextTrackedParts = nextState.combatantsById[targetId]?.trackedParts ?? []

  nextTrackedParts.forEach((trackedPart, index) => {
    const previousTrackedPart = previousTrackedParts[index]
    if (!previousTrackedPart) return

    const lostCount = trackedPart.currentCount - previousTrackedPart.currentCount
    if (lostCount < 0) {
      const severedCount = Math.abs(lostCount)
      loggedState = appendLog(loggedState, {
        type: 'note',
        actorId: options?.actorId ?? state.activeCombatantId ?? undefined,
        targetIds: [targetId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${getCombatantLabel(state, targetId)} loses ${severedCount} ${trackedPart.part}${severedCount === 1 ? '' : 's'}.`,
      })
    }

    if (
      trackedPart.deathWhenCountReaches != null &&
      previousTrackedPart.currentCount > trackedPart.deathWhenCountReaches &&
      trackedPart.currentCount <= trackedPart.deathWhenCountReaches
    ) {
      loggedState = appendLog(loggedState, {
        type: 'note',
        actorId: options?.actorId ?? state.activeCombatantId ?? undefined,
        targetIds: [targetId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${getCombatantLabel(state, targetId)} collapses as all ${trackedPart.part}s are destroyed.`,
      })
    }
  })

  return loggedState
}

export function applyHealingToCombatant(
  state: EncounterState,
  targetId: string,
  amount: number,
  options?: { actorId?: string | null; sourceLabel?: string },
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
    actorId: options?.actorId ?? state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} regains ${amount} hit points.`,
    details: options?.sourceLabel ? `Source: ${options.sourceLabel}.` : undefined,
  })
}

export function addConditionToCombatant(
  state: EncounterState,
  targetId: string,
  condition: string,
  options?: {
    durationTurns?: number
    tickOn?: 'start' | 'end'
    duration?: RuntimeMarkerDuration
    sourceLabel?: string
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
    type: 'condition_applied',
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
  options?: {
    durationTurns?: number
    tickOn?: 'start' | 'end'
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
    type: 'state_applied',
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
    type: 'state_removed',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses state: ${trimmedMarker}.`,
  })
}

function formatManualEffectLabel(effect: Effect): string {
  if (effect.kind === 'custom') {
    return `Custom: ${effect.id}`
  }

  if (effect.kind === 'save') {
    const successNotes = (effect.onSuccess ?? [])
      .map((nestedEffect) => (nestedEffect.kind === 'note' ? nestedEffect.text : formatEffectLabel(nestedEffect)))
      .join('; ')

    return successNotes
      ? `Save: ${effect.save.ability} (success: ${successNotes})`
      : `Save: ${effect.save.ability}`
  }

  if (effect.kind === 'note') {
    return effect.text
  }

  return formatEffectLabel(effect)
}

function noteRestoresToOneHitPoint(effect: Effect): boolean {
  return effect.kind === 'note' && /drops to 1 hit point instead/i.test(effect.text)
}

function applyManualEffectToCombatant(
  state: EncounterState,
  targetId: string,
  sourceLabel: string,
  effect: Effect,
  options?: { saveOutcome?: 'success' | 'fail' },
): EncounterState {
  if (effect.kind === 'condition') {
    return addConditionToCombatant(state, targetId, effect.conditionId, {
      sourceLabel,
    })
  }

  if (effect.kind === 'state') {
    return addStateToCombatant(state, targetId, effect.stateId, {
      sourceLabel,
    })
  }

  if (effect.kind === 'hit_points') {
    return effect.mode === 'heal'
      ? applyHealingToCombatant(state, targetId, effect.value, {
          sourceLabel,
        })
      : applyDamageToCombatant(state, targetId, effect.value, {
          sourceLabel,
        })
  }

  if (effect.kind === 'save') {
    const saveOutcome = options?.saveOutcome ?? 'success'
    const branchEffects = saveOutcome === 'success' ? (effect.onSuccess ?? []) : effect.onFail
    let nextState = appendEncounterNote(
      state,
      `${sourceLabel}: Save ${effect.save.ability} -> ${saveOutcome}.`,
      {
        actorId: targetId,
        targetIds: [targetId],
      },
    )

    branchEffects.forEach((branchEffect) => {
      nextState = applyManualEffectToCombatant(nextState, targetId, sourceLabel, branchEffect, options)
    })

    return nextState
  }

  let nextState = appendEncounterNote(state, `${sourceLabel}: ${formatManualEffectLabel(effect)}.`, {
    actorId: targetId,
    targetIds: [targetId],
  })

  if (noteRestoresToOneHitPoint(effect) && nextState.combatantsById[targetId]?.stats.currentHitPoints === 0) {
    nextState = applyHealingToCombatant(nextState, targetId, 1, {
      sourceLabel,
    })
  }

  return nextState
}

export function appendEncounterNote(
  state: EncounterState,
  summary: string,
  options?: {
    actorId?: string
    targetIds?: string[]
    details?: string
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
  })
}

export function appendEncounterLogEvent(
  state: EncounterState,
  event: Omit<CombatLogEvent, 'id' | 'timestamp'>,
): EncounterState {
  return appendLog(state, event)
}

export function updateEncounterCombatant(
  state: EncounterState,
  combatantId: string,
  updater: (combatant: CombatantInstance) => CombatantInstance,
): EncounterState {
  return updateCombatant(state, combatantId, updater)
}

export function getEncounterCombatantLabel(state: EncounterState, combatantId: string | null): string {
  return getCombatantLabel(state, combatantId)
}

export function appendHookTriggeredLog(
  state: EncounterState,
  combatantId: string,
  hookLabel: string,
  details?: string,
): EncounterState {
  return appendLog(state, {
    type: 'hook_triggered',
    actorId: combatantId,
    targetIds: [combatantId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, combatantId)} hook fires: ${hookLabel}.`,
    details,
  })
}

export function triggerManualHook(
  state: EncounterState,
  combatantId: string,
  hookLabel: string,
  effects: Effect[],
  options?: {
    details?: string
    saveOutcome?: 'success' | 'fail'
  },
): EncounterState {
  let nextState = appendHookTriggeredLog(state, combatantId, hookLabel, options?.details)

  effects.forEach((effect) => {
    nextState = applyManualEffectToCombatant(nextState, combatantId, hookLabel, effect, {
      saveOutcome: options?.saveOutcome,
    })
  })

  return nextState
}

export { formatMarkerLabel }
export { formatRuntimeEffectLabel }
