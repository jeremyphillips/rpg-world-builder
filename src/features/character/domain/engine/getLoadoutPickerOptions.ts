import type { Character } from '@/features/character/domain/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { EquipmentLoadout } from '@/features/character/domain/types'
import type { CreatureArmorCatalogEntry } from '@/features/mechanics/domain/equipment/armorClass'
import { resolveStatDetailed, type BreakdownToken } from '@/features/mechanics/domain/resolution'
import { buildCharacterContext, withLoadout } from './buildCharacterContext'
import {
  getEquipmentEffects,
  selectActiveEquipmentEffects,
} from '@/features/mechanics/domain/effects/sources/equipment-to-effects'

export type LoadoutOption = {
  loadout: EquipmentLoadout
  label: string
  totalAC: number
  breakdown: BreakdownToken[]
}

type InventoryItem = {
  id: string
  name: string
}

function getOwnedArmors(
  character: Character,
  armorById: Record<string, CreatureArmorCatalogEntry>,
): InventoryItem[] {
  const items: InventoryItem[] = []
  for (const id of character.equipment?.armor ?? []) {
    const item = armorById[id]
    if (!item) continue
    if (item.category === 'shields') continue
    items.push({ id, name: item.name })
  }
  return items
}

function getOwnedShields(
  character: Character,
  armorById: Record<string, CreatureArmorCatalogEntry>,
): InventoryItem[] {
  const items: InventoryItem[] = []
  for (const id of character.equipment?.armor ?? []) {
    const item = armorById[id]
    if (!item) continue
    if (item.category !== 'shields') continue
    items.push({ id, name: item.name })
  }
  return items
}

/**
 * Generate loadout picker options from the character's inventory.
 *
 * Each option is a loadout (armorId + shieldId) with a pre-resolved AC
 * and engine-provided breakdown tokens.
 * The picker writes the selected loadout to character.combat.loadout.
 */
export function getLoadoutPickerOptions(
  character: Character,
  intrinsicEffects: Effect[],
  armorById: Record<string, CreatureArmorCatalogEntry>,
): LoadoutOption[] {
  const context = buildCharacterContext(character)
  const candidateEffects = getEquipmentEffects(character.equipment, armorById)

  const armors = getOwnedArmors(character, armorById)
  const shields = getOwnedShields(character, armorById)

  const armorChoices: (InventoryItem | null)[] = [null, ...armors]
  const shieldChoices: (InventoryItem | null)[] = [null, ...shields]

  const options: LoadoutOption[] = []

  for (const armor of armorChoices) {
    for (const shield of shieldChoices) {
      const loadout: EquipmentLoadout = {
        armorId: armor?.id,
        shieldId: shield?.id,
      }

      const optionContext = withLoadout(context, loadout)
      const activeEffects = selectActiveEquipmentEffects(candidateEffects, loadout)
      const allEffects = [...intrinsicEffects, ...activeEffects]
      const result = resolveStatDetailed('armor_class', optionContext, allEffects)

      const label = [armor?.name ?? 'Unarmored', shield?.name].filter(Boolean).join(' + ')

      options.push({
        loadout,
        label,
        totalAC: result.value,
        breakdown: result.breakdown,
      })
    }
  }

  options.sort((a, b) => b.totalAC - a.totalAC)
  return options
}
