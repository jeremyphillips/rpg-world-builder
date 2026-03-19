import type { EncounterState } from './types'
import {
  buildRuntimeMarker,
  createEmptyTurnContext,
  getTurnKey,
  normalizeDamageType,
  syncCombatantTurnResources,
  updateCombatant,
} from './shared'
import { appendLog, getCombatantLabel } from './logging'
import type { RuntimeMarker } from './types'
import { dropConcentration } from './concentration-mutations'

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

  loggedState = checkConcentrationOnDamage(loggedState, targetId, amount)

  return loggedState
}

function checkConcentrationOnDamage(
  state: EncounterState,
  targetId: string,
  damage: number,
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target?.concentration) return state

  const dc = Math.max(10, Math.floor(damage / 2))
  const conModifier =
    target.stats.savingThrowModifiers?.constitution ??
    Math.floor(((target.stats.abilityScores?.constitution ?? 10) - 10) / 2)
  const rawRoll = Math.floor(Math.random() * 20) + 1
  const total = rawRoll + conModifier
  const succeeded = total >= dc

  let nextState = appendLog(state, {
    type: 'note',
    actorId: targetId,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} ${succeeded ? 'maintains' : 'loses'} concentration on ${target.concentration.spellLabel}.`,
    details: `CON save: d20 ${rawRoll} + ${conModifier} = ${total} vs DC ${dc}.`,
  })

  if (!succeeded) {
    nextState = dropConcentration(nextState, targetId)
  }

  return nextState
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
