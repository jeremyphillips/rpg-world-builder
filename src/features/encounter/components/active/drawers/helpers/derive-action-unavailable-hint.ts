import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'

/**
 * Returns a short user-facing hint for why an action row is disabled, or `null`
 * when the action is available.
 *
 * - **Resource hints** (action/bonus spent, uses exhausted, recharge) are derived
 *   from `CombatActionDefinition` metadata — lightweight and always correct.
 * - **Target hints** come from the authoritative `invalidActionReasons` map
 *   computed by `getActionTargetInvalidReason` at the encounter-state level.
 */
export function deriveActionUnavailableHint(
  action: CombatActionDefinition,
  availableActionIds: Set<string> | undefined,
  invalidActionReasons: Map<string, string> | undefined,
): string | null {
  const allTreatAsAvailable = availableActionIds == null
  const resourceAvailable = allTreatAsAvailable || availableActionIds!.has(action.id)

  if (!resourceAvailable) {
    return deriveResourceHint(action)
  }

  const targetReason = invalidActionReasons?.get(action.id)
  if (targetReason) {
    return targetReason
  }

  return null
}

function deriveResourceHint(action: CombatActionDefinition): string {
  if (action.usage?.uses && action.usage.uses.remaining <= 0) {
    return 'No uses remaining'
  }
  if (action.usage?.recharge && !action.usage.recharge.ready) {
    return 'Recharge not ready'
  }
  if (action.cost.bonusAction) return 'Bonus action spent this turn'
  return 'Action spent this turn'
}
