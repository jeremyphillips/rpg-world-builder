import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { CombatantTurnResources } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

import { deriveBucketState, deriveTurnExhaustion, type TurnOptionBucketState } from './turn-options'

export type CombatantTurnExhaustionInput = {
  combatantActions: readonly CombatActionDefinition[] | undefined
  availableActionIds: readonly string[]
  turnResources: CombatantTurnResources | null
}

function splitCombatantActionBuckets(actions: readonly CombatActionDefinition[] | undefined): {
  actionDefs: { id: string }[]
  bonusDefs: { id: string }[]
} {
  const list = actions ?? []
  return {
    actionDefs: list.filter((a) => a.cost.action && !a.cost.bonusAction),
    bonusDefs: list.filter((a) => a.cost.bonusAction),
  }
}

function reactionAvailabilityToBucketState(turnResources: CombatantTurnResources | null): TurnOptionBucketState {
  if (!turnResources) return 'spent'
  return turnResources.reactionAvailable ? 'available' : 'spent'
}

/**
 * Action/bonus buckets + movement + reaction, composed into {@link deriveTurnExhaustion}.
 * Reusable for encounter UI (header hints, End Turn emphasis, future turn-phase copy).
 */
export function deriveCombatantTurnExhaustion(
  input: CombatantTurnExhaustionInput,
): ReturnType<typeof deriveTurnExhaustion> {
  const { combatantActions, availableActionIds, turnResources } = input
  const { actionDefs, bonusDefs } = splitCombatantActionBuckets(combatantActions)
  const actionState = deriveBucketState(actionDefs, availableActionIds)
  const bonusActionState = deriveBucketState(bonusDefs, availableActionIds)
  return deriveTurnExhaustion({
    actionState,
    bonusActionState,
    movementRemaining: turnResources?.movementRemaining ?? null,
    reactionState: reactionAvailabilityToBucketState(turnResources),
  })
}
