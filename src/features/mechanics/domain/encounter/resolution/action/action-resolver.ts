import {
  applyDamageToCombatant,
  appendEncounterLogEvent,
  appendEncounterNote,
  getEncounterCombatantLabel,
  setConcentration,
  updateEncounterCombatant,
  getIncomingAttackModifiers,
  getOutgoingAttackModifiers,
  autoFailsSave,
  getSaveModifiersFromConditions,
  type CombatantInstance,
  type RollModifierMarker,
} from '../../state'
import {
  formatAttackRollDebug,
  formatAutoFailDebug,
  formatSaveDebug,
  formatTurnResourceDebug,
} from './resolution-debug'
import type { CombatActionDefinition } from '../combat-action.types'
import type { EncounterState } from '../../state/types'
import type { ResolveCombatActionSelection, ResolveCombatActionOptions } from '../action-resolution.types'
import { rollDie, rollDamage } from '../../../resolution/engines/dice.engine'
import {
  spendActionCost,
  getCombatantTurnResources,
  canSpendActionCost,
  canUseCombatAction,
  spendCombatActionUsage,
} from './action-cost'
import { getActionTargets, getSequenceStepCount } from './action-targeting'
import { applyActionEffects, formatMovementSummary, getImmunityStateLabel, getSaveModifier } from './action-effects'

export type { ResolveCombatActionSelection, ResolveCombatActionOptions } from '../action-resolution.types'

type RollModifierResult = {
  rollMod: 'advantage' | 'disadvantage' | 'normal'
  attackerMarkers: RollModifierMarker[]
  defenderMarkers: RollModifierMarker[]
}

function resolveRollModifier(
  attacker: CombatantInstance,
  defender: CombatantInstance,
  rollType: string,
  attackRange: 'melee' | 'ranged' = 'melee',
): RollModifierResult {
  const attackerMarkers = (attacker.rollModifiers ?? []).filter((m) =>
    matchesRollContext(m, rollType),
  )
  const defenderMarkers = (defender.rollModifiers ?? []).filter((m) =>
    matchesRollContext(m, `attacks against`),
  )
  const markerModifiers = [...attackerMarkers, ...defenderMarkers].map((m) => m.modifier)

  const conditionModifiers = [
    ...getOutgoingAttackModifiers(attacker, attackRange),
    ...getIncomingAttackModifiers(defender, attackRange),
  ]

  const all = [...markerModifiers, ...conditionModifiers]
  const hasAdv = all.includes('advantage')
  const hasDisadv = all.includes('disadvantage')
  const rollMod = hasAdv && hasDisadv ? 'normal'
    : hasAdv ? 'advantage'
    : hasDisadv ? 'disadvantage'
    : 'normal'

  return { rollMod, attackerMarkers, defenderMarkers }
}

function matchesRollContext(marker: RollModifierMarker, context: string): boolean {
  const targets = Array.isArray(marker.appliesTo) ? marker.appliesTo : [marker.appliesTo]
  return targets.some((t) => t === context || t === 'all' || context.includes(t))
}

function rollD20WithModifier(
  rollMod: 'advantage' | 'disadvantage' | 'normal',
  rng: () => number,
): { rawRoll: number; detail: string } {
  if (rollMod === 'normal') {
    const rawRoll = rollDie(20, rng)
    return { rawRoll, detail: `d20 ${rawRoll}` }
  }
  const roll1 = rollDie(20, rng)
  const roll2 = rollDie(20, rng)
  const rawRoll = rollMod === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2)
  return {
    rawRoll,
    detail: `d20 ${roll1}, ${roll2} (${rollMod}: ${rawRoll})`,
  }
}

function deriveAttackRange(action: CombatActionDefinition): 'melee' | 'ranged' {
  if (!action.displayMeta) return 'melee'
  if (action.displayMeta.source === 'natural') return 'melee'
  if (action.displayMeta.source === 'spell') {
    const range = action.displayMeta.range?.toLowerCase() ?? ''
    return range === 'touch' || range === 'self' ? 'melee' : 'ranged'
  }
  if (action.displayMeta.source === 'weapon') {
    const range = action.displayMeta.range?.toLowerCase() ?? ''
    return range.includes('ranged') ? 'ranged' : 'melee'
  }
  return 'melee'
}

function getActionLabel(action: CombatActionDefinition): string {
  return action.label || action.id
}

function getCombatantActions(combatant: CombatantInstance): CombatActionDefinition[] {
  return combatant.actions ?? []
}

export function getCombatantAvailableActions(
  state: EncounterState,
  actorId: string,
): CombatActionDefinition[] {
  const combatant = state.combatantsById[actorId]
  if (!combatant) return []

  const resources = getCombatantTurnResources(combatant)
  return getCombatantActions(combatant).filter(
    (action) => canSpendActionCost(resources, action.cost) && canUseCombatAction(action),
  )
}

function isConcentrationAction(action: CombatActionDefinition): boolean {
  return action.displayMeta?.source === 'spell' && action.displayMeta.concentration === true
}

export function resolveCombatAction(
  state: EncounterState,
  selection: ResolveCombatActionSelection,
  options: ResolveCombatActionOptions = {},
): EncounterState {
  const actor = state.combatantsById[selection.actorId]
  const action = actor ? getCombatantActions(actor).find((a) => a.id === selection.actionId) : undefined

  const result = resolveCombatActionInternal(state, selection, options, { skipCost: false })
  let finalState = result.state

  if (action && isConcentrationAction(action) && result.createdMarkerIds.length > 0) {
    const meta = action.displayMeta as { source: 'spell'; spellId: string; concentrationDurationTurns?: number }
    const durationTurns = meta.concentrationDurationTurns
    finalState = setConcentration(finalState, selection.actorId, {
      spellId: meta.spellId,
      spellLabel: action.label,
      linkedMarkerIds: result.createdMarkerIds,
      remainingTurns: durationTurns,
      totalTurns: durationTurns,
    })
  }

  return finalState
}

type InternalResolutionResult = {
  state: EncounterState
  createdMarkerIds: string[]
}

function resolveCombatActionInternal(
  state: EncounterState,
  selection: ResolveCombatActionSelection,
  options: ResolveCombatActionOptions,
  behavior: { skipCost: boolean },
): InternalResolutionResult {
  const noOp: InternalResolutionResult = { state, createdMarkerIds: [] }
  const actor = state.combatantsById[selection.actorId]
  if (!actor || state.activeCombatantId !== selection.actorId) return noOp

  const action = getCombatantActions(actor).find((candidate) => candidate.id === selection.actionId)
  if (!action) return noOp

  const resources = getCombatantTurnResources(actor)
  if (!behavior.skipCost && !canSpendActionCost(resources, action.cost)) {
    const resourceDebug = formatTurnResourceDebug(actor, action.cost)
    if (resourceDebug.length > 0) {
      return {
        state: appendEncounterNote(state, `${action.label || action.id} blocked: insufficient turn resources.`, {
          actorId: actor.instanceId,
          debugDetails: resourceDebug,
        }),
        createdMarkerIds: [],
      }
    }
    return noOp
  }
  if (!behavior.skipCost && !canUseCombatAction(action)) return noOp

  const targets = getActionTargets(state, actor, selection, action)
  const target = targets[0]
  if (action.resolutionMode === 'attack-roll') {
    if (!target) {
      return noOp
    }
  }

  const rng = options.rng ?? Math.random
  const actionLabel = getActionLabel(action)
  const targetLabel = target ? getEncounterCombatantLabel(state, target.instanceId) : 'no target'
  const allMarkerIds: string[] = []

  let nextState = appendEncounterLogEvent(state, {
    type: 'action-declared',
    actorId: actor.instanceId,
    targetIds: target ? [target.instanceId] : undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${actor.source.label} uses ${actionLabel}${target ? ` against ${targetLabel}` : ''}.`,
  })

  if (action.movement) {
    nextState = appendEncounterNote(
      nextState,
      `${actionLabel}: ${formatMovementSummary(action.movement)}${
        action.targeting?.kind === 'entered-during-move'
          ? ' Resolution uses the selected target as the creature crossed during movement.'
          : ''
      }`,
      {
        actorId: actor.instanceId,
        targetIds: target ? [target.instanceId] : undefined,
      },
    )
  }

  if (action.sequence && action.sequence.length > 0) {
    for (const step of action.sequence) {
      const iterationCount = getSequenceStepCount(nextState, actor.instanceId, step)
      const childAction = getCombatantActions(nextState.combatantsById[actor.instanceId] ?? actor).find(
        (candidate) => candidate.label === step.actionLabel,
      )
      if (!childAction) continue

      for (let index = 0; index < iterationCount; index += 1) {
        const childResult = resolveCombatActionInternal(
          nextState,
          {
            actorId: actor.instanceId,
            targetId: selection.targetId,
            actionId: childAction.id,
          },
          options,
          { skipCost: true },
        )
        nextState = childResult.state
        allMarkerIds.push(...childResult.createdMarkerIds)
      }
    }

    nextState = appendEncounterLogEvent(nextState, {
      type: 'action-resolved',
      actorId: actor.instanceId,
      targetIds: target ? [target.instanceId] : undefined,
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: `${actionLabel} resolves its action sequence.`,
      details: action.logText,
    })

    if (!behavior.skipCost && action.kind === 'spell' && action.usage?.uses && action.displayMeta?.source === 'spell') {
      options.onSpellSlotSpent?.(actor.source.sourceId, action.displayMeta.spellId)
    }
    const finalState = behavior.skipCost
      ? nextState
      : updateEncounterCombatant(nextState, actor.instanceId, (combatant) => ({
          ...combatant,
          actions: getCombatantActions(combatant).map((candidate) =>
            candidate.id === action.id ? spendCombatActionUsage(candidate) : candidate,
          ),
          turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
        }))
    return { state: finalState, createdMarkerIds: allMarkerIds }
  }

  if (action.resolutionMode === 'attack-roll') {
    const attackBonus = action.attackProfile?.attackBonus
    if (target == null || attackBonus == null) return { state: nextState, createdMarkerIds: [] }

    const attackRange = deriveAttackRange(action)
    const { rollMod, attackerMarkers, defenderMarkers } = resolveRollModifier(actor, target, 'attack rolls', attackRange)
    const { rawRoll, detail: rollDetail } = rollD20WithModifier(rollMod, rng)
    const totalRoll = rawRoll + attackBonus
    const isNaturalTwenty = rawRoll === 20
    const isNaturalOne = rawRoll === 1
    const hit = isNaturalTwenty || (!isNaturalOne && totalRoll >= target.stats.armorClass)
    const isCritical = isNaturalTwenty

    const hitSuffix = isCritical ? ' (critical hit)' : ''
    const missSuffix = isNaturalOne ? ' (natural 1)' : ''
    const attackDebug = formatAttackRollDebug(actor, target, attackerMarkers, defenderMarkers, attackRange, rollMod)
    nextState = appendEncounterLogEvent(nextState, {
      type: hit ? 'attack-hit' : 'attack-missed',
      actorId: actor.instanceId,
      targetIds: [target.instanceId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: hit
        ? `${actor.source.label} hits ${targetLabel} with ${actionLabel}${hitSuffix}.`
        : `${actor.source.label} misses ${targetLabel} with ${actionLabel}${missSuffix}.`,
      details: `Attack roll: ${rollDetail} + ${attackBonus} = ${totalRoll} vs AC ${target.stats.armorClass}.`,
      debugDetails: attackDebug.length > 1 ? attackDebug : undefined,
    })

    if (hit) {
      const damage = rollDamage(action.attackProfile?.damage, rng, { critical: isCritical })
      if (damage && damage.total > 0) {
        nextState = applyDamageToCombatant(nextState, target.instanceId, damage.total, {
          actorId: actor.instanceId,
          sourceLabel: actionLabel,
          damageType: action.attackProfile?.damageType,
        })
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action-resolved',
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${actionLabel} resolves for ${damage.total} damage.`,
          details: damage.details,
        })
      } else {
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action-resolved',
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${actionLabel} resolves with no damage roll.`,
        })
      }

      const hitResult = applyActionEffects(
        nextState,
        actor,
        nextState.combatantsById[target.instanceId] ?? target,
        action,
        action.onHitEffects,
        { rng, sourceLabel: actionLabel },
      )
      nextState = hitResult.state
      allMarkerIds.push(...hitResult.createdMarkerIds)
    } else {
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves with no damage dealt.`,
      })
    }
  } else if (action.resolutionMode === 'saving-throw') {
    if (targets.length === 0 || !action.saveProfile) return { state: nextState, createdMarkerIds: [] }

    for (const saveTarget of targets) {
      if (saveTarget.states.some((stateMarker) => stateMarker.label === getImmunityStateLabel(action.label))) {
        nextState = appendEncounterNote(
          nextState,
          `${saveTarget.source.label} ignores ${actionLabel}.`,
          {
            actorId: actor.instanceId,
            targetIds: [saveTarget.instanceId],
            details: `Target is already immune to ${actionLabel}.`,
          },
        )
        continue
      }

      const saveAbility = action.saveProfile.ability

      if (autoFailsSave(saveTarget, saveAbility)) {
        const autoFailDebug = formatAutoFailDebug(saveTarget, saveAbility)
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action-resolved',
          actorId: actor.instanceId,
          targetIds: [saveTarget.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${saveTarget.source.label} automatically fails the ${saveAbility.toUpperCase()} save against ${actionLabel}.`,
          details: `Auto-fail: condition prevents ${saveAbility.toUpperCase()} saving throw.`,
          debugDetails: autoFailDebug.length > 0 ? autoFailDebug : undefined,
        })

        const saveEffectResult = applyActionEffects(
          nextState,
          actor,
          saveTarget,
          action,
          action.onFailEffects,
          { rng, sourceLabel: actionLabel },
        )
        nextState = saveEffectResult.state
        allMarkerIds.push(...saveEffectResult.createdMarkerIds)

        if (action.damage) {
          const rolledDamage = rollDamage(action.damage, rng)
          if (rolledDamage && rolledDamage.total > 0) {
            nextState = applyDamageToCombatant(nextState, saveTarget.instanceId, rolledDamage.total, {
              actorId: actor.instanceId,
              sourceLabel: actionLabel,
              damageType: action.damageType,
            })
          }
        }
        continue
      }

      const condSaveMods = getSaveModifiersFromConditions(saveTarget, saveAbility)
      const saveHasAdv = condSaveMods.includes('advantage')
      const saveHasDisadv = condSaveMods.includes('disadvantage')
      const saveRollMod: 'advantage' | 'disadvantage' | 'normal' =
        saveHasAdv && saveHasDisadv ? 'normal'
          : saveHasAdv ? 'advantage'
          : saveHasDisadv ? 'disadvantage'
          : 'normal'

      const { rawRoll, detail: saveRollDetail } = rollD20WithModifier(saveRollMod, rng)
      const saveModifier = getSaveModifier(saveTarget, saveAbility)
      const totalRoll = rawRoll + saveModifier
      const succeeded = totalRoll >= action.saveProfile.dc

      const saveDebug = formatSaveDebug(saveTarget, saveAbility, saveRollMod)
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: [saveTarget.instanceId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${saveTarget.source.label} ${succeeded ? 'succeeds' : 'fails'} the ${saveAbility.toUpperCase()} save against ${actionLabel}.`,
        details: `Saving throw: ${saveRollDetail} + ${saveModifier} = ${totalRoll} vs DC ${action.saveProfile.dc}.`,
        debugDetails: saveDebug.length > 0 ? saveDebug : undefined,
      })

      if (action.damage) {
        const rolledDamage = rollDamage(action.damage, rng)
        if (rolledDamage && rolledDamage.total > 0) {
          const damageTotal =
            succeeded && action.saveProfile.halfDamageOnSave
              ? Math.floor(rolledDamage.total / 2)
              : succeeded
                ? 0
                : rolledDamage.total

          if (damageTotal > 0) {
            nextState = applyDamageToCombatant(nextState, saveTarget.instanceId, damageTotal, {
              actorId: actor.instanceId,
              sourceLabel: actionLabel,
              damageType: action.damageType,
            })
          }
        }
      }

      const saveEffectResult = applyActionEffects(
        nextState,
        actor,
        saveTarget,
        action,
        succeeded ? action.onSuccessEffects : action.onFailEffects,
        { rng, sourceLabel: actionLabel },
      )
      nextState = saveEffectResult.state
      allMarkerIds.push(...saveEffectResult.createdMarkerIds)
    }
  } else if (action.resolutionMode === 'effects') {
    if (targets.length === 0 && action.effects?.length) {
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves with no valid targets.`,
      })
    } else {
      for (const effectTarget of targets) {
        const resolvedTarget = nextState.combatantsById[effectTarget.instanceId] ?? effectTarget
        const effectPayload =
          action.hpThreshold != null
            ? resolvedTarget.stats.currentHitPoints <= action.hpThreshold.maxHp
              ? action.effects
              : action.aboveThresholdEffects ?? []
            : action.effects
        const effectResult = applyActionEffects(
          nextState,
          actor,
          resolvedTarget,
          action,
          effectPayload,
          { rng, sourceLabel: actionLabel },
        )
        nextState = effectResult.state
        allMarkerIds.push(...effectResult.createdMarkerIds)
      }

      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: targets.map((t) => t.instanceId),
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves its effects.`,
        details: action.logText,
      })
    }
  } else {
    nextState = appendEncounterLogEvent(nextState, {
      type: action.kind === 'spell' ? 'spell-logged' : 'action-resolved',
      actorId: actor.instanceId,
      targetIds: target ? [target.instanceId] : undefined,
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary:
        action.kind === 'spell'
          ? `${actor.source.label} logs spell effect: ${actionLabel}.`
          : `${actionLabel} resolves as a log-only action.`,
      details: action.logText,
    })
  }

  if (!behavior.skipCost && action.kind === 'spell' && action.usage?.uses && action.displayMeta?.source === 'spell') {
    options.onSpellSlotSpent?.(actor.source.sourceId, action.displayMeta.spellId)
  }
  const finalState = behavior.skipCost
    ? nextState
    : updateEncounterCombatant(nextState, actor.instanceId, (combatant) => ({
        ...combatant,
        actions: getCombatantActions(combatant).map((candidate) =>
          candidate.id === action.id ? spendCombatActionUsage(candidate) : candidate,
        ),
        turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
      }))
  return { state: finalState, createdMarkerIds: allMarkerIds }
}
