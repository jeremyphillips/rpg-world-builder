import {
  applyDamageToCombatant,
  appendEncounterLogEvent,
  appendEncounterNote,
  getEncounterCombatantLabel,
  updateEncounterCombatant,
  type CombatantInstance,
} from '../../state'
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
