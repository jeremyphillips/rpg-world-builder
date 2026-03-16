import {
  addConditionToCombatant,
  addStateToCombatant,
  addStatModifierToCombatant,
  applyDamageToCombatant,
  appendEncounterLogEvent,
  appendEncounterNote,
  getEncounterCombatantLabel,
  updateEncounterCombatant,
} from '../state'
import { getAbilityModifier } from '../../core/ability.utils'
import { abilityIdToKey } from '../../core/character/abilities.utils'
import type { AbilityRef } from '../../core/character/abilities.types'
import type { Effect } from '../../effects/effects.types'
import type {
  CombatActionCost,
  CombatActionDefinition,
  CombatActionSequenceStep,
} from './combat-action.types'
import {
  createCombatTurnResources,
  effectDurationToRuntimeDuration,
  type CombatantInstance,
  type CombatantTurnResources,
} from '../state'
import type { EncounterState } from '../state/types'
import type { ResolveCombatActionSelection, ResolveCombatActionOptions } from './action-resolution.types'

export type { ResolveCombatActionSelection, ResolveCombatActionOptions } from './action-resolution.types'

type ParsedDamageExpression =
  | { kind: 'flat'; value: number }
  | { kind: 'dice'; count: number; die: number; modifier: number; expression: string }

function rollDie(sides: number, rng: () => number): number {
  return Math.floor(rng() * sides) + 1
}

function getActionLabel(action: CombatActionDefinition): string {
  return action.label || action.id
}

function getCombatantActions(combatant: CombatantInstance): CombatActionDefinition[] {
  return combatant.actions ?? []
}

function getTrackedPartCount(
  state: EncounterState,
  actorId: string,
  part: 'head' | 'limb',
): number {
  return state.combatantsById[actorId]?.trackedParts?.find((trackedPart) => trackedPart.part === part)?.currentCount ?? 0
}

function getSequenceStepCount(
  state: EncounterState,
  actorId: string,
  step: CombatActionSequenceStep,
): number {
  if (step.countFromTrackedPart) {
    return getTrackedPartCount(state, actorId, step.countFromTrackedPart)
  }

  return step.count
}

function getActionTargets(
  state: EncounterState,
  actor: CombatantInstance,
  selection: ResolveCombatActionSelection,
  action: CombatActionDefinition,
): CombatantInstance[] {
  if (action.targeting?.kind === 'self') {
    return [actor]
  }

  if (action.targeting?.kind === 'all-enemies') {
    return Object.values(state.combatantsById).filter(
      (combatant) => combatant.side !== actor.side && combatant.stats.currentHitPoints > 0,
    )
  }

  if (!selection.targetId) return []
  const target = state.combatantsById[selection.targetId]
  if (!target || target.side === actor.side || target.stats.currentHitPoints <= 0) return []
  return [target]
}

function getSaveModifier(combatant: CombatantInstance, ability: AbilityRef): number {
  const abilityKey = abilityIdToKey(ability)
  return (
    combatant.stats.savingThrowModifiers?.[abilityKey] ??
    getAbilityModifier(combatant.stats.abilityScores?.[abilityKey] ?? 10)
  )
}

function getImmunityStateLabel(actionLabel: string): string {
  return `immune to ${actionLabel}`
}

function formatMovementSummary(effect: {
  upToSpeed?: boolean
  upToSpeedFraction?: 0.5 | 1
  noOpportunityAttacks?: boolean
  canEnterCreatureSpaces?: boolean
  targetSizeMax?: string
  straightTowardVisibleEnemy?: boolean
  forced?: boolean
  toNearestUnoccupiedSpace?: boolean
  withinFeetOfSource?: number
  failIfNoSpace?: boolean
  movesWithSource?: boolean
}): string {
  const parts: string[] = []

  if (effect.upToSpeed) {
    parts.push('move up to its Speed')
  } else if (effect.upToSpeedFraction != null) {
    parts.push(`move up to ${effect.upToSpeedFraction * 100}% of its Speed`)
  }

  if (effect.noOpportunityAttacks) {
    parts.push('without provoking opportunity attacks')
  }

  if (effect.canEnterCreatureSpaces) {
    const sizeLimit = effect.targetSizeMax ? `${effect.targetSizeMax} or smaller` : 'eligible'
    parts.push(`may enter ${sizeLimit} creature spaces`)
  }

  if (effect.straightTowardVisibleEnemy) {
    parts.push('must move straight toward a visible enemy')
  }

  if (effect.movesWithSource) {
    parts.push('target moves with the source')
  }

  if (effect.forced) {
    parts.push('forced movement')
  }

  if (effect.withinFeetOfSource != null) {
    parts.push(`ends within ${effect.withinFeetOfSource} feet of the source`)
  }

  if (effect.toNearestUnoccupiedSpace) {
    parts.push('moves to the nearest unoccupied space')
  }

  if (effect.failIfNoSpace) {
    parts.push('fails if no space is available')
  }

  return parts.length > 0 ? `${parts.join('; ')}.` : 'Movement effect noted.'
}

function formatNestedEffectSummary(effect: Effect): string | null {
  if (effect.kind === 'condition') {
    return `Condition: ${effect.conditionId}.`
  }

  if (effect.kind === 'damage') {
    return `Damage: ${effect.damage}${effect.damageType ? ` ${effect.damageType}` : ''}.`
  }

  if (effect.kind === 'note') {
    return effect.text
  }

  if (effect.kind === 'move') {
    return formatMovementSummary(effect)
  }

  return null
}

function applyActionEffects(
  state: EncounterState,
  actor: CombatantInstance,
  target: CombatantInstance,
  action: CombatActionDefinition,
  effects: Effect[] | undefined,
  options: { rng: () => number; sourceLabel: string },
): EncounterState {
  if (!effects || effects.length === 0) return state

  let nextState = state

  effects.forEach((effect) => {
    if (effect.kind === 'save') {
      if (typeof effect.save.dc !== 'number') {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Unsupported save DC rule.`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
        return
      }

      const rawRoll = rollDie(20, options.rng)
      const saveModifier = getSaveModifier(target, effect.save.ability)
      const totalRoll = rawRoll + saveModifier
      const succeeded = totalRoll >= effect.save.dc

      nextState = appendEncounterNote(
        nextState,
        `${options.sourceLabel}: ${target.source.label} ${succeeded ? 'succeeds' : 'fails'} the ${effect.save.ability.toUpperCase()} save.`,
        {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          details: `Saving throw: d20 ${rawRoll} + ${saveModifier} = ${totalRoll} vs DC ${effect.save.dc}.`,
        },
      )

      nextState = applyActionEffects(
        nextState,
        actor,
        target,
        action,
        succeeded ? effect.onSuccess : effect.onFail,
        options,
      )
      return
    }

    if (effect.kind === 'damage') {
      const rolledDamage = rollDamage(String(effect.damage), options.rng)
      if (rolledDamage && rolledDamage.total > 0) {
        nextState = applyDamageToCombatant(nextState, target.instanceId, rolledDamage.total, {
          actorId: actor.instanceId,
          sourceLabel: options.sourceLabel,
          damageType: effect.damageType,
        })
      }
      return
    }

    if (effect.kind === 'condition') {
      nextState = addConditionToCombatant(nextState, target.instanceId, effect.conditionId, {
        sourceLabel: options.sourceLabel,
      })
      return
    }

    if (effect.kind === 'state') {
      nextState = addStateToCombatant(nextState, target.instanceId, effect.stateId, {
        sourceLabel: options.sourceLabel,
      })

      if (effect.escape) {
        nextState = appendEncounterNote(
          nextState,
          `${options.sourceLabel}: Escape DC ${effect.escape.dc} ${effect.escape.ability?.toUpperCase() ?? ''}${effect.escape.skill ? ` (${effect.escape.skill})` : ''}${effect.escape.actionRequired ? ' as an action' : ''}.`
            .replace(/\s+/g, ' ')
            .trim(),
          {
            actorId: actor.instanceId,
            targetIds: [target.instanceId],
          },
        )
      }

      if (effect.notes) {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${effect.notes}`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
      }

      const ongoingSummary = (effect.ongoingEffects ?? [])
        .map((nestedEffect) => formatNestedEffectSummary(nestedEffect))
        .filter((summary): summary is string => Boolean(summary))
        .join(' ')

      if (ongoingSummary) {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${ongoingSummary}`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
      }
      return
    }

    if (effect.kind === 'modifier' && effect.target === 'armor_class' && effect.mode === 'add' && typeof effect.value === 'number') {
      const runtimeDuration = effectDurationToRuntimeDuration(effect) ?? undefined
      nextState = addStatModifierToCombatant(
        nextState,
        target.instanceId,
        {
          id: `stat-mod-ac-${action.id}-${target.instanceId}`,
          label: `+${effect.value} AC`,
          target: 'armor_class',
          mode: 'add',
          value: effect.value,
          duration: runtimeDuration,
        },
        { sourceLabel: options.sourceLabel },
      )
      return
    }

    if (effect.kind === 'immunity' && effect.scope === 'spell') {
      const runtimeDuration = effectDurationToRuntimeDuration(effect) ?? undefined
      const stateLabel = `Immune: ${effect.spellIds.join(', ')}`
      nextState = addStateToCombatant(nextState, target.instanceId, stateLabel, {
        duration: runtimeDuration,
        sourceLabel: options.sourceLabel,
      })
      return
    }

    if (effect.kind === 'immunity' && effect.scope === 'source-action') {
      nextState = addStateToCombatant(nextState, target.instanceId, getImmunityStateLabel(action.label), {
        sourceLabel: options.sourceLabel,
      })
      return
    }

    if (effect.kind === 'death-outcome') {
      if (target.stats.currentHitPoints <= 0) {
        nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${target.source.label} ${effect.outcome.replaceAll('-', ' ')}.`, {
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
        })
      }
      return
    }

    if (effect.kind === 'interval') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Interval effect ${effect.stateId} is noted for later runtime support.`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'move') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${formatMovementSummary(effect)}`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    if (effect.kind === 'note') {
      nextState = appendEncounterNote(nextState, `${options.sourceLabel}: ${effect.text}`, {
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
      })
      return
    }

    nextState = appendEncounterNote(nextState, `${options.sourceLabel}: Unsupported effect ${effect.kind}.`, {
      actorId: actor.instanceId,
      targetIds: [target.instanceId],
    })
  })

  return nextState
}

function parseDamageExpression(input?: string): ParsedDamageExpression | null {
  if (!input) return null

  const trimmed = input.trim()
  if (trimmed.length === 0 || trimmed === '—' || trimmed === '-') return null

  if (/^\d+$/.test(trimmed)) {
    return { kind: 'flat', value: Number(trimmed) }
  }

  const normalized = trimmed.replace(/\s+/g, '')
  const match = normalized.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) return null

  return {
    kind: 'dice',
    count: Number(match[1]),
    die: Number(match[2]),
    modifier: match[3] ? Number(match[3]) : 0,
    expression: trimmed,
  }
}

function rollDamage(input: string | undefined, rng: () => number): {
  total: number
  details: string
} | null {
  const parsed = parseDamageExpression(input)
  if (!parsed) return null

  if (parsed.kind === 'flat') {
    return {
      total: parsed.value,
      details: `Damage: ${parsed.value}.`,
    }
  }

  const rolls = Array.from({ length: parsed.count }, () => rollDie(parsed.die, rng))
  const diceTotal = rolls.reduce((sum, value) => sum + value, 0)
  const total = Math.max(0, diceTotal + parsed.modifier)
  const modifierText =
    parsed.modifier === 0 ? '' : parsed.modifier > 0 ? ` + ${parsed.modifier}` : ` - ${Math.abs(parsed.modifier)}`

  return {
    total,
    details: `Damage: ${parsed.expression} -> [${rolls.join(', ')}]${modifierText} = ${total}.`,
  }
}

function spendActionCost(resources: CombatantTurnResources, cost: CombatActionCost): CombatantTurnResources {
  return {
    ...resources,
    actionAvailable: cost.action ? false : resources.actionAvailable,
    bonusActionAvailable: cost.bonusAction ? false : resources.bonusActionAvailable,
    reactionAvailable: cost.reaction ? false : resources.reactionAvailable,
    movementRemaining:
      cost.movementFeet != null
        ? Math.max(0, resources.movementRemaining - cost.movementFeet)
        : resources.movementRemaining,
  }
}

function getCombatantTurnResources(combatant: CombatantInstance): CombatantTurnResources {
  return combatant.turnResources ?? createCombatTurnResources()
}

function canUseCombatAction(action: CombatActionDefinition): boolean {
  if (action.usage?.recharge && !action.usage.recharge.ready) return false
  if (action.usage?.uses && action.usage.uses.remaining <= 0) return false
  return true
}

function spendCombatActionUsage(action: CombatActionDefinition): CombatActionDefinition {
  if (!action.usage) return action

  return {
    ...action,
    usage: {
      recharge: action.usage.recharge
        ? {
            ...action.usage.recharge,
            ready: false,
          }
        : undefined,
      uses: action.usage.uses
        ? {
            ...action.usage.uses,
            remaining: Math.max(0, action.usage.uses.remaining - 1),
          }
        : undefined,
    },
  }
}

export function canSpendActionCost(resources: CombatantTurnResources, cost: CombatActionCost): boolean {
  if (cost.action && !resources.actionAvailable) return false
  if (cost.bonusAction && !resources.bonusActionAvailable) return false
  if (cost.reaction && !resources.reactionAvailable) return false
  if (cost.movementFeet != null && resources.movementRemaining < cost.movementFeet) return false
  return true
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

export function resolveCombatAction(
  state: EncounterState,
  selection: ResolveCombatActionSelection,
  options: ResolveCombatActionOptions = {},
): EncounterState {
  return resolveCombatActionInternal(state, selection, options, { skipCost: false })
}

function resolveCombatActionInternal(
  state: EncounterState,
  selection: ResolveCombatActionSelection,
  options: ResolveCombatActionOptions,
  behavior: { skipCost: boolean },
): EncounterState {
  const actor = state.combatantsById[selection.actorId]
  if (!actor || state.activeCombatantId !== selection.actorId) return state

  const action = getCombatantActions(actor).find((candidate) => candidate.id === selection.actionId)
  if (!action) return state

  const resources = getCombatantTurnResources(actor)
  if (!behavior.skipCost && !canSpendActionCost(resources, action.cost)) return state
  if (!behavior.skipCost && !canUseCombatAction(action)) return state

  const targets = getActionTargets(state, actor, selection, action)
  const target = targets[0]
  if (action.resolutionMode === 'attack-roll') {
    if (!target) {
      return state
    }
  }

  const rng = options.rng ?? Math.random
  const actionLabel = getActionLabel(action)
  const targetLabel = target ? getEncounterCombatantLabel(state, target.instanceId) : 'no target'

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
        nextState = resolveCombatActionInternal(
          nextState,
          {
            actorId: actor.instanceId,
            targetId: selection.targetId,
            actionId: childAction.id,
          },
          options,
          { skipCost: true },
        )
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

    return behavior.skipCost
      ? nextState
      : updateEncounterCombatant(nextState, actor.instanceId, (combatant) => ({
          ...combatant,
          actions: getCombatantActions(combatant).map((candidate) =>
            candidate.id === action.id ? spendCombatActionUsage(candidate) : candidate,
          ),
          turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
        }))
  }

  if (action.resolutionMode === 'attack-roll') {
    const attackBonus = action.attackProfile?.attackBonus
    if (target == null || attackBonus == null) return nextState

    const rawRoll = rollDie(20, rng)
    const totalRoll = rawRoll + attackBonus
    const hit = totalRoll >= target.stats.armorClass

    nextState = appendEncounterLogEvent(nextState, {
      type: hit ? 'attack-hit' : 'attack-missed',
      actorId: actor.instanceId,
      targetIds: [target.instanceId],
      round: state.roundNumber,
      turn: state.turnIndex + 1,
      summary: hit
        ? `${actor.source.label} hits ${targetLabel} with ${actionLabel}.`
        : `${actor.source.label} misses ${targetLabel} with ${actionLabel}.`,
      details: `Attack roll: d20 ${rawRoll} + ${attackBonus} = ${totalRoll} vs AC ${target.stats.armorClass}.`,
    })

    if (hit) {
      const damage = rollDamage(action.attackProfile?.damage, rng)
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

      nextState = applyActionEffects(
        nextState,
        actor,
        nextState.combatantsById[target.instanceId] ?? target,
        action,
        action.onHitEffects,
        { rng, sourceLabel: actionLabel },
      )
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
    if (targets.length === 0 || !action.saveProfile) return nextState

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

      const rawRoll = rollDie(20, rng)
      const saveModifier = getSaveModifier(saveTarget, action.saveProfile.ability)
      const totalRoll = rawRoll + saveModifier
      const succeeded = totalRoll >= action.saveProfile.dc

      nextState = appendEncounterLogEvent(nextState, {
        type: 'action-resolved',
        actorId: actor.instanceId,
        targetIds: [saveTarget.instanceId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${saveTarget.source.label} ${succeeded ? 'succeeds' : 'fails'} the ${action.saveProfile.ability.toUpperCase()} save against ${actionLabel}.`,
        details: `Saving throw: d20 ${rawRoll} + ${saveModifier} = ${totalRoll} vs DC ${action.saveProfile.dc}.`,
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

      nextState = applyActionEffects(
        nextState,
        actor,
        saveTarget,
        action,
        succeeded ? action.onSuccessEffects : action.onFailEffects,
        { rng, sourceLabel: actionLabel },
      )
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
        nextState = applyActionEffects(
          nextState,
          actor,
          nextState.combatantsById[effectTarget.instanceId] ?? effectTarget,
          action,
          action.effects,
          { rng, sourceLabel: actionLabel },
        )
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

  return behavior.skipCost
    ? nextState
    : updateEncounterCombatant(nextState, actor.instanceId, (combatant) => ({
        ...combatant,
        actions: getCombatantActions(combatant).map((candidate) =>
          candidate.id === action.id ? spendCombatActionUsage(candidate) : candidate,
        ),
        turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
      }))
}
