import type { CharacterClassInfo } from '@/features/character/domain/types'
import type { EquipmentProficiency } from '@/features/mechanics/domain/proficiencies/proficiency-adapters'

import { mergeEquipmentProficiency } from './mergeEquipmentProficiency'
import { resolveClassDef, type ResolveClassDefOptions } from './resolveClassDef'

const EMPTY: EquipmentProficiency = { categories: [], items: [] }

/**
 * Weapon and armor proficiency grants from each class's **documented** `proficiencies`
 * (same source fields as engine `collectBaseProficiencyEffects`, but class lookup is catalog-aware).
 */
export function collectClassGrantedWeaponArmor(
  classes: readonly CharacterClassInfo[] | undefined,
  options: ResolveClassDefOptions = {},
): { weapon: EquipmentProficiency; armor: EquipmentProficiency } {
  let weapon = EMPTY
  let armor = EMPTY

  for (const cls of classes ?? []) {
    if (!cls.classId) continue
    const def = resolveClassDef(cls.classId, options)
    if (!def) continue

    const profs = def.proficiencies
    if (!profs || Array.isArray(profs as unknown)) continue

    const w = profs.weapons
    const wSlice: EquipmentProficiency = {
      categories: [...(w.categories ?? [])],
      items: [...(w.items ?? [])],
    }
    if (wSlice.categories.length > 0 || wSlice.items.length > 0) {
      weapon = mergeEquipmentProficiency(weapon, wSlice)
    }

    const ar = profs.armor
    const aSlice: EquipmentProficiency = {
      categories: [...(ar.categories ?? [])],
      items: [...(ar.items ?? [])],
    }
    if (aSlice.categories.length > 0 || aSlice.items.length > 0) {
      armor = mergeEquipmentProficiency(armor, aSlice)
    }
  }

  return { weapon, armor }
}
