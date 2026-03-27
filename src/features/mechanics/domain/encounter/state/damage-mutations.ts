import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantDeathRecord, CombatantRemainsKind } from './types/combatant.types'
import type { EncounterState } from './types'
import {
  buildRuntimeMarker,
  createEmptyTurnContext,
  getTurnKey,
  normalizeDamageType,
  syncCombatantTurnResources,
  updateCombatant,
} from './shared'
import type { CombatLogEvent } from './types'
import { appendLog, getCombatantLabel } from './logging'
import type { RuntimeMarker } from './types'
import { dropConcentration } from './concentration-mutations'
import { getDamageAfterResistance } from './resistance-mutations'
import { getDamageResistanceFromConditions } from './condition-rules'
import { formatDamageResistanceDebug } from '../resolution/action/resolution-debug'
import { resolveReducedToZeroHpTrait } from './reduced-to-zero-hp'

export function applyDamageToCombatant(
  state: EncounterState,
  targetId: string,
  amount: number,
  options?: {
    actorId?: string | null
    sourceLabel?: string
    damageType?: string
    /** When this damage reduces the creature to 0 HP, set remains (e.g. disintegrate). */
    remainsOnKill?: CombatantRemainsKind
    /** When true (e.g. natural 20 on attack), Undead Fortitude–style saves are bypassed where authored. */
    criticalHit?: boolean
    /** RNG for Undead Fortitude CON save and similar; defaults to `Math.random` when omitted. */
    rng?: () => number
    /** Monster catalog — required for automatic `reduced-to-0-hp` traits (e.g. Undead Fortitude). */
    monstersById?: Record<string, Monster>
  },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target || amount <= 0) return state

  let { adjusted, applied } = getDamageAfterResistance(
    amount,
    options?.damageType,
    target.damageResistanceMarkers ?? [],
  )

  if (!applied) {
    const conditionResistance = getDamageResistanceFromConditions(target, options?.damageType)
    if (conditionResistance === 'resistance') {
      adjusted = Math.floor(amount / 2)
      applied = { damageType: options?.damageType ?? 'all', level: 'resistance', sourceId: 'condition', label: 'condition', id: 'condition-resistance' }
    } else if (conditionResistance === 'vulnerability') {
      adjusted = amount * 2
      applied = { damageType: options?.damageType ?? 'all', level: 'vulnerability', sourceId: 'condition', label: 'condition', id: 'condition-vulnerability' }
    }
  }

  let resistanceLogState = state
  if (applied) {
    const condResDebug = applied.sourceId === 'condition'
      ? formatDamageResistanceDebug(target, options?.damageType)
      : []
    resistanceLogState = appendLog(state, {
      type: 'note',
      actorId: options?.actorId ?? state.activeCombatantId ?? undefined,
      targetIds: [targetId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${getCombatantLabel(state, targetId)} has ${applied.level} to ${applied.damageType ?? 'all'} damage (${amount} → ${adjusted}).`,
      debugDetails: condResDebug.length > 0 ? condResDebug : undefined,
    })
  }

  if (adjusted <= 0) return resistanceLogState

  const effectiveAmount = adjusted
  const turnKey = getTurnKey(resistanceLogState)
  const rng = options?.rng ?? Math.random
  const round = resistanceLogState.roundNumber
  const turn = resistanceLogState.turnIndex + 1

  let reducedToZeroLogEvents: Array<Omit<CombatLogEvent, 'id' | 'timestamp'>> = []

  let nextState = updateCombatant(resistanceLogState, targetId, (combatant) => {
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
      const damageTakenThisTurn = baseDamageTakenThisTurn + effectiveAmount
      const damageTakenByTypeThisTurn =
        normalizedDamageType == null
          ? baseDamageTakenByTypeThisTurn
          : {
              ...baseDamageTakenByTypeThisTurn,
              [normalizedDamageType]:
                (baseDamageTakenByTypeThisTurn[normalizedDamageType] ?? 0) + effectiveAmount,
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
    const isFatalTrackedPart = Boolean(fatalTrackedPart)

    const prevHp = combatant.stats.currentHitPoints
    const rawNewHp = fatalTrackedPart ? 0 : Math.max(0, combatant.stats.currentHitPoints - effectiveAmount)

    let newHp = rawNewHp
    let deathRecord: CombatantDeathRecord | undefined

    if (!isFatalTrackedPart && prevHp > 0 && rawNewHp === 0) {
      const reduced = resolveReducedToZeroHpTrait(
        combatant,
        prevHp,
        effectiveAmount,
        isFatalTrackedPart,
        round,
        turn,
        {
          damageType: options?.damageType,
          criticalHit: options?.criticalHit,
          monstersById: options?.monstersById,
          rng,
          remainsOnKill: options?.remainsOnKill,
          allCombatants: Object.values(resistanceLogState.combatantsById),
        },
      )
      if (reduced) {
        newHp = reduced.newHp
        deathRecord = reduced.defeatOutcome?.death
        reducedToZeroLogEvents = reduced.logEvents
      } else {
        deathRecord =
          prevHp > 0 && rawNewHp === 0
            ? {
                remains: (options?.remainsOnKill ?? combatant.remains ?? 'corpse') as CombatantRemainsKind,
                diedAtRound: combatant.diedAtRound ?? resistanceLogState.roundNumber,
              }
            : undefined
      }
    } else {
      newHp = rawNewHp
      deathRecord =
        prevHp > 0 && rawNewHp === 0
          ? {
              remains: (options?.remainsOnKill ?? combatant.remains ?? 'corpse') as CombatantRemainsKind,
              diedAtRound: combatant.diedAtRound ?? resistanceLogState.roundNumber,
            }
          : undefined
    }

    return {
      ...combatant,
      ...(deathRecord ? { remains: deathRecord.remains, diedAtRound: deathRecord.diedAtRound } : {}),
      stats: {
        ...combatant.stats,
        currentHitPoints: newHp,
      },
      trackedParts,
      turnResources: syncCombatantTurnResources({
        ...combatant,
        trackedParts,
      }),
      suppressedHooks,
      turnContext: {
        totalDamageTaken: currentTurnContext.totalDamageTaken + effectiveAmount,
        damageTakenByType:
          normalizedDamageType == null
            ? currentTurnContext.damageTakenByType
            : {
                ...currentTurnContext.damageTakenByType,
                [normalizedDamageType]:
                  (currentTurnContext.damageTakenByType[normalizedDamageType] ?? 0) + effectiveAmount,
              },
      },
    }
  })

  const stateAfterSleepWake = removeSleepUnconsciousOnDamage(
    nextState,
    targetId,
    effectiveAmount,
    options?.actorId ?? resistanceLogState.activeCombatantId ?? null,
  )

  const attackerIdForCharm = options?.actorId ?? resistanceLogState.activeCombatantId ?? null
  const stateAfterCharm = removeCharmedFromCasterSideDamage(
    stateAfterSleepWake,
    targetId,
    attackerIdForCharm,
  )

  let loggedState = appendLog(stateAfterCharm, {
    type: 'damage-applied',
    actorId: options?.actorId ?? state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(resistanceLogState, targetId)} takes ${effectiveAmount} damage.`,
    details: [
      options?.sourceLabel ? `Source: ${options.sourceLabel}.` : null,
      options?.damageType ? `Damage type: ${options.damageType}.` : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  })

  for (const ev of reducedToZeroLogEvents) {
    loggedState = appendLog(loggedState, ev)
  }

  const previousTrackedParts = target.trackedParts ?? []
  const nextTrackedParts = stateAfterCharm.combatantsById[targetId]?.trackedParts ?? []

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

  loggedState = checkConcentrationOnDamage(loggedState, targetId, effectiveAmount)

  return loggedState
}

/** Sleep: unconscious from failed second save is tagged `classification: ['sleep']`; any damage ends it. */
function removeSleepUnconsciousOnDamage(
  state: EncounterState,
  targetId: string,
  damageAmount: number,
  actorId?: string | null,
): EncounterState {
  if (damageAmount <= 0) return state
  const target = state.combatantsById[targetId]
  if (!target) return state
  const hadSleepUnconscious = target.conditions.some(
    (m) => m.label === 'unconscious' && m.classification?.includes('sleep'),
  )
  if (!hadSleepUnconscious) return state

  const remaining = target.conditions.filter(
    (m) => !(m.label === 'unconscious' && m.classification?.includes('sleep')),
  )
  if (remaining.length === target.conditions.length) return state

  let nextState = updateCombatant(state, targetId, (c) => ({ ...c, conditions: remaining }))
  nextState = appendLog(nextState, {
    type: 'condition-removed',
    actorId: actorId ?? state.activeCombatantId ?? undefined,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses unconscious (Sleep ends on damage).`,
  })
  return nextState
}

/**
 * Charm Person / similar: charmed ends when the charmer or any ally on the charmer's side
 * damages the target. Uses `sourceInstanceId` on the charmed marker as the charmer's combatant id.
 */
function removeCharmedFromCasterSideDamage(
  state: EncounterState,
  targetId: string,
  attackerId: string | null,
): EncounterState {
  if (attackerId == null) return state
  const attacker = state.combatantsById[attackerId]
  const target = state.combatantsById[targetId]
  if (!attacker || !target) return state

  const remaining = target.conditions.filter((m) => {
    if (m.label !== 'charmed' || !m.sourceInstanceId) return true
    const charmer = state.combatantsById[m.sourceInstanceId]
    if (!charmer) return true
    return attacker.side !== charmer.side
  })
  if (remaining.length === target.conditions.length) return state

  let nextState = updateCombatant(state, targetId, (c) => ({
    ...c,
    conditions: remaining,
  }))
  nextState = appendLog(nextState, {
    type: 'condition-removed',
    actorId: attackerId,
    targetIds: [targetId],
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${getCombatantLabel(state, targetId)} loses condition: charmed (damaged by caster or ally).`,
  })
  return nextState
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

/**
 * Healing only clears **death aftermath** when the target **revives** (`prevHp ≤ 0` and `newHp > 0`):
 * `remains` and `diedAtRound` are removed so the combatant is no longer dead-recorded or
 * targetable as `dead-creature`. Healing that leaves HP at 0 does not clear those fields.
 */
export function applyHealingToCombatant(
  state: EncounterState,
  targetId: string,
  amount: number,
  options?: { actorId?: string | null; sourceLabel?: string },
): EncounterState {
  const target = state.combatantsById[targetId]
  if (!target || amount <= 0) return state

  const nextState = updateCombatant(state, targetId, (combatant) => {
    const prevHp = combatant.stats.currentHitPoints
    const newHp = Math.min(combatant.stats.maxHitPoints, combatant.stats.currentHitPoints + amount)
    const revivedFromDead = prevHp <= 0 && newHp > 0
    return {
      ...combatant,
      ...(revivedFromDead
        ? { remains: undefined, diedAtRound: undefined, remainsConsumed: undefined }
        : {}),
      stats: {
        ...combatant.stats,
        currentHitPoints: newHp,
      },
    }
  })

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
