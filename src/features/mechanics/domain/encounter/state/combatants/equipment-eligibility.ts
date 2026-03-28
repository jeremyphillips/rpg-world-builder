import type { Condition } from '../../../conditions/condition.types'
import type { Effect } from '../../../effects/effects.types'

/** Detect authored `equipment.armorEquipped === null` (self) conditions on modifier effects. */
export function inferStatModifierEligibilityFromEffect(effect: Effect):
  | { requiresUnarmored: true }
  | undefined {
  const cond = 'condition' in effect ? (effect as { condition?: Condition }).condition : undefined
  if (!cond || cond.kind !== 'state') return undefined
  if (cond.target !== 'self') return undefined
  if (cond.property !== 'equipment.armorEquipped') return undefined
  if (cond.equals !== null) return undefined
  return { requiresUnarmored: true }
}
