import type { EvaluationContext } from '../conditions/evaluation-context.types'
import type { AbilityKey } from '@/features/mechanics/domain/character'
import { getAbilityModifier } from '../abilities/getAbilityModifier'
import type { WeaponAttackInput } from '../resolution/resolvers/attack-resolver'

/**
 * Determine which ability score drives the attack/damage roll.
 */
export function getWeaponAttackAbility(
  context: EvaluationContext,
  weapon: WeaponAttackInput
): AbilityKey {
  const isFinesse = weapon.properties?.includes('finesse') ?? false
  const isRanged = weapon.type === 'ranged'

  if (isFinesse) {
    const str = getAbilityModifier(context.self, 'strength')
    const dex = getAbilityModifier(context.self, 'dexterity')
    return dex >= str ? 'dexterity' : 'strength'
  }

  return isRanged ? 'dexterity' : 'strength'
}
