import type { Character } from '@/features/character/domain/types'

export type WeaponPickerOption = {
  weaponId: string
  name: string
  type?: string
  properties?: string[]
}

/**
 * Build selectable weapon options from the character's owned weapons.
 *
 * Returns one entry per owned weapon with catalog name and basic properties.
 * The UI uses this to populate the main-hand / off-hand pickers.
 */
export function getWeaponPickerOptions(
  character: Character,
  weaponsById: Record<string, { id: string; name: string; type?: string; properties?: string[] }>,
): WeaponPickerOption[] {
  const ownedIds = character.equipment?.weapons ?? []

  return ownedIds.map((id) => {
    const weapon = weaponsById[id]
    return {
      weaponId: id,
      name: weapon?.name ?? id,
      type: weapon?.type,
      properties: weapon?.properties,
    }
  })
}
