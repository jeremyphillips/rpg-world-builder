import { applyDamageToCombatant, appendEncounterLogEvent, getEncounterCombatantLabel, updateEncounterCombatant } from './encounter-state'
import type { CombatActionCost, CombatActionDefinition, CombatActionSequenceStep } from './combat-actions.types'
import { createCombatTurnResources, type CombatantInstance, type CombatantTurnResources } from './combatant.types'
import type { EncounterState } from './encounter.types'

export interface ResolveCombatActionSelection {
  actorId: string
  targetId?: string
  actionId: string
}

export interface ResolveCombatActionOptions {
  rng?: () => number
}

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
  return getCombatantActions(combatant).filter((action) => canSpendActionCost(resources, action.cost))
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

  const target = selection.targetId ? state.combatantsById[selection.targetId] : undefined
  if (action.resolutionMode === 'attack_roll') {
    if (!target || target.side === actor.side || target.stats.currentHitPoints <= 0) {
      return state
    }
  }

  const rng = options.rng ?? Math.random
  const actionLabel = getActionLabel(action)
  const targetLabel = target ? getEncounterCombatantLabel(state, target.instanceId) : 'no target'

  let nextState = appendEncounterLogEvent(state, {
    type: 'action_declared',
    actorId: actor.instanceId,
    targetIds: target ? [target.instanceId] : undefined,
    round: state.roundNumber,
    turn: state.turnIndex + 1,
    summary: `${actor.source.label} uses ${actionLabel}${target ? ` against ${targetLabel}` : ''}.`,
  })

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
      type: 'action_resolved',
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
          turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
        }))
  }

  if (action.resolutionMode === 'attack_roll') {
    const attackBonus = action.attackProfile?.attackBonus
    if (target == null || attackBonus == null) return nextState

    const rawRoll = rollDie(20, rng)
    const totalRoll = rawRoll + attackBonus
    const hit = totalRoll >= target.stats.armorClass

    nextState = appendEncounterLogEvent(nextState, {
      type: hit ? 'attack_hit' : 'attack_missed',
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
          type: 'action_resolved',
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${actionLabel} resolves for ${damage.total} damage.`,
          details: damage.details,
        })
      } else {
        nextState = appendEncounterLogEvent(nextState, {
          type: 'action_resolved',
          actorId: actor.instanceId,
          targetIds: [target.instanceId],
          round: state.roundNumber,
          turn: state.turnIndex + 1,
          summary: `${actionLabel} resolves with no damage roll.`,
        })
      }
    } else {
      nextState = appendEncounterLogEvent(nextState, {
        type: 'action_resolved',
        actorId: actor.instanceId,
        targetIds: [target.instanceId],
        round: state.roundNumber,
        turn: state.turnIndex + 1,
        summary: `${actionLabel} resolves with no damage dealt.`,
      })
    }
  } else {
    nextState = appendEncounterLogEvent(nextState, {
      type: action.kind === 'spell' ? 'spell_logged' : 'action_resolved',
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
        turnResources: spendActionCost(getCombatantTurnResources(combatant), action.cost),
      }))
}
