import type { EquipmentProficiency } from '@/features/mechanics/domain/proficiencies/proficiency-adapters'

import type { CharacterDerivedContext, BuildCharacterDerivedContextArgs } from './characterDerived.types'
import { collectClassGrantedToolIds } from './grants/collectClassGrantedTools'
import { collectClassGrantedWeaponArmor } from './grants/collectClassGrantedWeaponArmor'
import { mergeEquipmentProficiency } from './grants/mergeEquipmentProficiency'

const EMPTY_WEAPON_ARMOR: EquipmentProficiency = { categories: [], items: [] }

/**
 * Build {@link CharacterDerivedContext} for sheet-style reads.
 *
 * Phase 1A: proficiency slices only. Uses {@link CharacterQueryContext} for persisted skill ids;
 * class weapon/armor/tool grants use catalog-aware class resolution.
 */
export function buildCharacterDerivedContext(args: BuildCharacterDerivedContextArgs): CharacterDerivedContext {
  const { character, query, catalogs, rulesetId } = args
  const resolveOpts = { classesById: catalogs?.classesById, rulesetId }

  const grantedWeaponArmor = collectClassGrantedWeaponArmor(character.classes, resolveOpts)
  const grantedToolIds = collectClassGrantedToolIds(character.classes, resolveOpts)

  const baseSkillIds = new Set(query.proficiencies.skillIds)
  const baseToolIds = new Set<string>()
  const grantedSkillIds = new Set<string>()

  return {
    proficiencies: {
      base: {
        skillIds: baseSkillIds,
        weapon: { categories: [], items: [] },
        armor: { categories: [], items: [] },
        toolIds: new Set(baseToolIds),
      },
      granted: {
        weapon: {
          categories: [...grantedWeaponArmor.weapon.categories],
          items: [...grantedWeaponArmor.weapon.items],
        },
        armor: {
          categories: [...grantedWeaponArmor.armor.categories],
          items: [...grantedWeaponArmor.armor.items],
        },
        toolIds: new Set(grantedToolIds),
        skillIds: new Set(grantedSkillIds),
      },
      effective: {
        weapon: mergeEquipmentProficiency(EMPTY_WEAPON_ARMOR, grantedWeaponArmor.weapon),
        armor: mergeEquipmentProficiency(EMPTY_WEAPON_ARMOR, grantedWeaponArmor.armor),
        toolIds: new Set([...baseToolIds, ...grantedToolIds]),
        skillIds: new Set([...baseSkillIds, ...grantedSkillIds]),
      },
    },
  }
}
