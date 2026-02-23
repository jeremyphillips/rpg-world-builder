import type { Character } from '@/shared/types'
import { resolveEquipmentEdition } from '@/features/equipment/domain'
import type { WeaponItem, WeaponEditionDatum } from '@/data/equipment/weapons.types'

export type WeaponPickerOption = {
  weaponId: string
  name: string
  type?: 'melee' | 'ranged'
  properties?: string[]
}

function getWeaponEditionData(
  weaponId: string,
  editionId: string,
  weaponsById: Record<string, WeaponItem>,
): WeaponEditionDatum | undefined {
  const resolved = resolveEquipmentEdition(editionId)
  const weapon = weaponsById[weaponId]
  return weapon?.editionData?.find((d) => d.edition === resolved)
}

/**
 * Build selectable weapon options from the character's owned weapons.
 *
 * Returns one entry per owned weapon with catalog name and basic properties.
 * The UI uses this to populate the main-hand / off-hand pickers.
 */
export function getWeaponPickerOptions(
  character: Character,
  weaponsById: Record<string, WeaponItem>,
): WeaponPickerOption[] {
  const ownedIds = character.equipment?.weapons ?? []
  const editionId = character.edition

  return ownedIds.map((id) => {
    const weapon = weaponsById[id]
    const edData = getWeaponEditionData(id, editionId, weaponsById)

    return {
      weaponId: id,
      name: weapon?.name ?? id,
      type: edData?.type,
      properties: edData?.properties,
    }
  })
}
