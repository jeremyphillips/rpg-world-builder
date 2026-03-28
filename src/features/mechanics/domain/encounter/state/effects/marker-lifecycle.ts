import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type {
  DamageResistanceMarker,
  RuntimeEffectInstance,
  RuntimeMarker,
} from '../types'
import type { EncounterState } from '../types'
import {
  normalizeDamageType,
  syncCombatantTurnResources,
  updateCombatant,
} from '../shared'
import { maybeRestoreBattlefieldPlacement } from '../battlefield/battlefield-return-placement'
import { appendLog, getCombatantLabel } from './logging'
import { applyHealingToCombatant, expireStatModifier } from '../mutations/mutations'
import type { StatModifierMarker } from '../types'

export function tickMarkers<T extends RuntimeMarker>(
  markers: T[],
  boundary: TurnBoundary,
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

export function tickRuntimeEffects(
  runtimeEffects: RuntimeEffectInstance[],
  boundary: TurnBoundary,
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

export function tickStatModifiers(
  modifiers: StatModifierMarker[],
  boundary: TurnBoundary,
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

export function tickDamageResistanceMarkers(
  markers: DamageResistanceMarker[],
  boundary: TurnBoundary,
): { nextMarkers: DamageResistanceMarker[]; expired: DamageResistanceMarker[] } {
  const nextMarkers: DamageResistanceMarker[] = []
  const expired: DamageResistanceMarker[] = []

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
      duration: { ...marker.duration, remainingTurns },
    })
  })

  return { nextMarkers, expired }
}

export function processTrackedPartTurnEnd(
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

export function processMarkerBoundary(
  state: EncounterState,
  combatantId: string | null,
  boundary: TurnBoundary,
): EncounterState {
  if (!combatantId) return state

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  const conditionTick = tickMarkers(combatant.conditions, boundary)
  const stateTick = tickMarkers(combatant.states, boundary)
  const suppressionTick = tickMarkers(combatant.suppressedHooks ?? [], boundary)
  const statModTick = tickStatModifiers(combatant.statModifiers ?? [], boundary)
  const resistanceTick = tickDamageResistanceMarkers(combatant.damageResistanceMarkers ?? [], boundary)
  const hasChanges =
    conditionTick.expired.length > 0 ||
    stateTick.expired.length > 0 ||
    suppressionTick.expired.length > 0 ||
    statModTick.expired.length > 0 ||
    resistanceTick.expired.length > 0

  const withTicks = hasChanges
    ? updateCombatant(state, combatantId, (current) => ({
        ...current,
        conditions: conditionTick.nextMarkers,
        states: stateTick.nextMarkers,
        suppressedHooks: suppressionTick.nextMarkers,
        statModifiers: statModTick.nextModifiers,
        damageResistanceMarkers: resistanceTick.nextMarkers,
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

  resistanceTick.expired.forEach((marker) => {
    nextState = appendLog(nextState, {
      type: 'note',
      actorId: combatantId,
      targetIds: [combatantId],
      round: nextState.roundNumber,
      turn: nextState.turnIndex + 1,
      summary: `${getCombatantLabel(nextState, combatantId)} loses ${marker.level} to ${marker.damageType} damage.`,
      details: `Expired at turn ${boundary}.`,
    })
  })

  return maybeRestoreBattlefieldPlacement(nextState, combatantId)
}

export function processRuntimeEffectBoundary(
  state: EncounterState,
  combatantId: string | null,
  boundary: TurnBoundary,
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
