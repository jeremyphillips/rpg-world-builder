import type { CombatActionCost, CombatActionDefinition } from '../combat-action.types'
import {
  createCombatTurnResources,
  type CombatantInstance,
  type CombatantTurnResources,
} from '../../state'

export function spendActionCost(
  resources: CombatantTurnResources,
  cost: CombatActionCost,
): CombatantTurnResources {
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

export function getCombatantTurnResources(combatant: CombatantInstance): CombatantTurnResources {
  return combatant.turnResources ?? createCombatTurnResources()
}

export function canSpendActionCost(
  resources: CombatantTurnResources,
  cost: CombatActionCost,
): boolean {
  if (cost.action && !resources.actionAvailable) return false
  if (cost.bonusAction && !resources.bonusActionAvailable) return false
  if (cost.reaction && !resources.reactionAvailable) return false
  if (cost.movementFeet != null && resources.movementRemaining < cost.movementFeet) return false
  return true
}

/**
 * Check if an action can be used (recharge ready, uses remaining).
 *
 * KNOWN EDGE CASES:
 * - Warlock pact: period 'short-rest' not yet modeled; would need separate check.
 */
export function canUseCombatAction(action: CombatActionDefinition): boolean {
  if (action.usage?.recharge && !action.usage.recharge.ready) return false
  if (action.usage?.uses && action.usage.uses.remaining <= 0) return false
  return true
}

export function spendCombatActionUsage(
  action: CombatActionDefinition,
): CombatActionDefinition {
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
