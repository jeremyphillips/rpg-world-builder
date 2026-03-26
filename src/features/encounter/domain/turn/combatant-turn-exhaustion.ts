import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution'
import type { CombatantTurnResources } from '@/features/mechanics/domain/encounter/state/types'

import {
  deriveBucketState,
  deriveTurnExhaustion,
  partitionCombatantActionBuckets,
  // type TurnOptionBucketState,
} from './turn-options'

export type CombatantTurnExhaustionInput = {
  combatantActions: readonly CombatActionDefinition[] | undefined
  availableActionIds: readonly string[]
  turnResources: CombatantTurnResources | null
}

// function reactionAvailabilityToBucketState(turnResources: CombatantTurnResources | null): TurnOptionBucketState {
//   if (!turnResources) return 'spent'
//   return turnResources.reactionAvailable ? 'available' : 'spent'
// }

/**
 * Action/bonus buckets + movement + reaction, composed into {@link deriveTurnExhaustion}.
 * Reusable for encounter UI (header hints, End Turn emphasis, future turn-phase copy).
 */
export function deriveCombatantTurnExhaustion(
  input: CombatantTurnExhaustionInput,
): ReturnType<typeof deriveTurnExhaustion> {
  const { combatantActions, availableActionIds, turnResources } = input
  const { actionDefs, bonusDefs } = partitionCombatantActionBuckets(combatantActions)
  const actionState = deriveBucketState(actionDefs, availableActionIds)
  const bonusActionState = deriveBucketState(bonusDefs, availableActionIds)
  return deriveTurnExhaustion({
    actionState,
    bonusActionState,
    movementRemaining: turnResources?.movementRemaining ?? null,
  })
}
