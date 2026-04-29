import { isItemProficient } from '@/features/mechanics/domain/proficiencies/proficiency-adapters'

import type { CharacterDerivedContext } from '../characterDerived.types'

export function hasEffectiveWeaponProficiency(
  derived: CharacterDerivedContext,
  weapon: Pick<{ id: string; category?: string }, 'id' | 'category'>,
): boolean {
  return isItemProficient(weapon, derived.proficiencies.effective.weapon)
}

export function hasEffectiveArmorProficiency(
  derived: CharacterDerivedContext,
  armor: Pick<{ id: string; category?: string }, 'id' | 'category'>,
): boolean {
  return isItemProficient(armor, derived.proficiencies.effective.armor)
}

export function hasEffectiveToolProficiency(derived: CharacterDerivedContext, toolId: string): boolean {
  return derived.proficiencies.effective.toolIds.has(toolId)
}
