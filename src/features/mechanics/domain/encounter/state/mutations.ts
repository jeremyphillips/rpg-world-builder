import type { CombatantInstance, EncounterState, RuntimeMarker, RuntimeMarkerDuration, StatModifierMarker } from './types'
import {
  buildRuntimeMarker,
  createEmptyTurnContext,
  getTurnKey,
  markerMatches,
  normalizeDamageType,
  syncCombatantTurnResources,
  updateCombatant,
} from './shared'
import { appendLog, getCombatantLabel } from './logging'

export function updateEncounterCombatant(
  state: EncounterState,
  combatantId: string,
  updater: (combatant: CombatantInstance) => CombatantInstance,
): EncounterState {
  return updateCombatant(state, combatantId, updater)
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
        trackedPart.loss?.trigger === 'damage-taken-in-single-turn'
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
      turnResources: syncCombatantTurnResources({
        ...combatant,
        trackedParts,
      }),
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
    type: 'damage-applied',
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
    type: 'healing-applied',
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

function applyStatModifierToStats(
  stats: CombatantInstance['stats'],
  modifier: StatModifierMarker,
): CombatantInstance['stats'] {
  if (modifier.target === 'armor_class' && modifier.mode === 'add') {
    return { ...stats, armorClass: stats.armorClass + modifier.value }
  }
  return stats
}

function reverseStatModifierFromStats(
  stats: CombatantInstance['stats'],
  modifier: StatModifierMarker,
): CombatantInstance['stats'] {
  if (modifier.target === 'armor_class' && modifier.mode === 'add') {
    return { ...stats, armorClass: stats.armorClass - modifier.value }
  }
  return stats
}

export function addStatModifierToCombatant(
  state: EncounterState,
  targetId: string,
  modifier: StatModifierMarker,
  options?: { sourceLabel?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  const nextState = updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    stats: applyStatModifierToStats(combatant.stats, modifier),
    statModifiers: [...(combatant.statModifiers ?? []), modifier],
  }))

  return appendLog(nextState, {
    type: 'note',
    actorId: state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} gains ${modifier.label}.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      modifier.duration
        ? `Duration: ${modifier.duration.remainingTurns} turn(s), tick on ${modifier.duration.tickOn}.`
        : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })
}

export function expireStatModifier(
  state: EncounterState,
  targetId: string,
  modifier: StatModifierMarker,
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target) return state

  return updateCombatant(state, targetId, (combatant) => ({
    ...combatant,
    stats: reverseStatModifierFromStats(combatant.stats, modifier),
    statModifiers: (combatant.statModifiers ?? []).filter((m) => m.id !== modifier.id),
  }))
}
