import type {
  CombatantInstance,
  RuntimeEffectInstance,
  RuntimeMarker,
} from './types'
import { rollInitiative, type InitiativeResolverOptions } from '../resolution'
import type { EncounterState } from './types'
import {
  createCombatantTurnResources,
  effectDurationToRuntimeDuration,
  formatRuntimeEffectLabel,
  formatTurnHookNote,
  indexCombatants,
  normalizeDamageType,
  requirementLabel,
  seedRuntimeEffects,
  syncCombatantTurnResources,
  unmetHookRequirements,
  updateCombatant,
  createEmptyTurnContext,
  rollRechargeDie,
} from './shared'
import {
  appendLog,
  createEncounterStartedLog,
  createRoundStartedLog,
  createTurnEndedLog,
  createTurnStartedLog,
  getCombatantLabel,
} from './logging'
import {
  addConditionToCombatant,
  addStateToCombatant,
  applyDamageToCombatant,
  applyHealingToCombatant,
  expireStatModifier,
} from './mutations'
import type { StatModifierMarker } from './types'

function tickMarkers<T extends RuntimeMarker>(
  markers: T[],
  boundary: 'start' | 'end',
): { nextMarkers: T[]; expired: T[] } {
  const nextMarkers: T[] = []
  const expired: T[] = []

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

function processTrackedPartTurnEnd(
  state: EncounterState,
  combatantId: string | null,
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant || (combatant.trackedParts?.length ?? 0) === 0) return state

  const trackedParts = combatant.trackedParts ?? []
  const updatedTrackedParts = trackedParts.map((trackedPart) => {
    if (trackedPart.regrowth?.trigger !== 'turn-end') {
      return {
        ...trackedPart,
        lostSinceLastTurn: 0,
        regrowthSuppressedByDamageTypes: [],
      }
    }

    const isSuppressed =
      trackedPart.regrowth.suppressedByDamageTypes?.some((damageType) =>
        trackedPart.regrowthSuppressedByDamageTypes.includes(normalizeDamageType(damageType) ?? ''),
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
    turnResources: syncCombatantTurnResources({
      ...current,
      trackedParts: updatedTrackedParts,
    }),
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

function tickStatModifiers(
  modifiers: StatModifierMarker[],
  boundary: 'start' | 'end',
): { nextModifiers: StatModifierMarker[]; expired: StatModifierMarker[] } {
  const nextModifiers: StatModifierMarker[] = []
  const expired: StatModifierMarker[] = []

  modifiers.forEach((modifier) => {
    if (!modifier.duration || modifier.duration.tickOn !== boundary) {
      nextModifiers.push(modifier)
      return
    }

    const remainingTurns = modifier.duration.remainingTurns - 1
    if (remainingTurns <= 0) {
      expired.push(modifier)
      return
    }

    nextModifiers.push({
      ...modifier,
      duration: { ...modifier.duration, remainingTurns },
    })
  })

  return { nextModifiers, expired }
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
  const statModTick = tickStatModifiers(combatant.statModifiers ?? [], boundary)
  const hasChanges =
    conditionTick.expired.length > 0 ||
    stateTick.expired.length > 0 ||
    suppressionTick.expired.length > 0 ||
    statModTick.expired.length > 0

  const withTicks = hasChanges
    ? updateCombatant(state, combatantId, (current) => ({
        ...current,
        conditions: conditionTick.nextMarkers,
        states: stateTick.nextMarkers,
        suppressedHooks: suppressionTick.nextMarkers,
        statModifiers: statModTick.nextModifiers,
      }))
    : state

  let nextState = withTicks

  statModTick.expired.forEach((modifier) => {
    nextState = expireStatModifier(nextState, combatantId, modifier)
    nextState = appendLog(nextState, {
      type: 'note',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} stat modifier expires: ${modifier.label}.`,
      details: `Expired at turn ${boundary}.`,
    })
  })

  conditionTick.expired.forEach((marker) => {
    nextState = appendLog(nextState, {
      type: 'condition-removed',
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
      type: 'state-removed',
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
      type: 'effect-expired',
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
      type: 'hook-triggered',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} hook fires: ${hook.label}.`,
      details: `${boundary} of turn.`,
    })

    hook.effects.forEach((effect) => {
      if (effect.kind === 'hit-points') {
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

function resetCombatantTurnState(state: EncounterState, combatantId: string | null): EncounterState {
  if (!combatantId) return state

  return updateCombatant(state, combatantId, (combatant) => ({
    ...combatant,
    turnContext: createEmptyTurnContext(),
    turnResources: createCombatantTurnResources(combatant),
  }))
}

function processActionRecharge(
  state: EncounterState,
  combatantId: string | null,
  rng: () => number,
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant || !combatant.actions || combatant.actions.length === 0) return state

  const rechargeResults = combatant.actions.flatMap((action) => {
    const recharge = action.usage?.recharge
    const remainingUses = action.usage?.uses?.remaining
    if (!recharge || recharge.ready || remainingUses === 0) return []

    const roll = rollRechargeDie(rng)
    const recharged = roll >= recharge.min && roll <= recharge.max

    return [
      {
        actionId: action.id,
        actionLabel: action.label,
        roll,
        min: recharge.min,
        max: recharge.max,
        recharged,
      },
    ]
  })

  if (rechargeResults.length === 0) return state

  let nextState = updateCombatant(state, combatantId, (current) => ({
    ...current,
    actions: (current.actions ?? []).map((action) => {
      const result = rechargeResults.find((entry) => entry.actionId === action.id)
      if (!result || !action.usage?.recharge) return action

      return {
        ...action,
        usage: {
          ...action.usage,
          recharge: {
            ...action.usage.recharge,
            ready: result.recharged,
          },
        },
      }
    }),
  }))

  rechargeResults.forEach((result) => {
    nextState = appendLog(nextState, {
      type: 'note',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: result.recharged
        ? `${getCombatantLabel(nextState, combatantId)} recharges ${result.actionLabel}.`
        : `${getCombatantLabel(nextState, combatantId)} does not recharge ${result.actionLabel}.`,
      details: `Recharge roll: d6 ${result.roll} vs ${result.min}-${result.max}.`,
    })
  })

  return nextState
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
    const withRecharge = processActionRecharge(
      withResetContext,
      state.activeCombatantId,
      options.rng ?? Math.random,
    )
    const withStartExpiry = processRuntimeEffectBoundary(withRecharge, state.activeCombatantId, 'start')
    const withMarkerExpiry = processMarkerBoundary(withStartExpiry, state.activeCombatantId, 'start')
    return executeTurnHooks(withMarkerExpiry, state.activeCombatantId, 'start')
  }

  return state
}

export function advanceEncounterTurn(
  state: EncounterState,
  options: InitiativeResolverOptions = {},
): EncounterState {
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
  const withRecharge = processActionRecharge(
    withResetContext,
    withResetContext.activeCombatantId,
    options.rng ?? Math.random,
  )

  return executeTurnHooks(
    processMarkerBoundary(
      processRuntimeEffectBoundary(withRecharge, withRecharge.activeCombatantId, 'start'),
      withRecharge.activeCombatantId,
      'start',
    ),
    withRecharge.activeCombatantId,
    'start',
  )
}

export { formatRuntimeEffectLabel }
