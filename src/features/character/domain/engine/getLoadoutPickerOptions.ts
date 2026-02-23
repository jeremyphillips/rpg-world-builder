import type { Character } from '@/shared/types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { EquipmentLoadout } from '@/shared/types/character.core'
import { equipment as equipmentData } from '@/data'
import type { ArmorEditionDatum } from '@/data/equipment/armor.types'
import { resolveStatDetailed, type BreakdownToken } from '@/features/mechanics/domain/resolution/stat-resolver'
import { buildCharacterContext } from './buildCharacterContext'
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

function getOwnedArmors(character: Character): InventoryItem[] {
  const edition = character.edition ?? '5e'
  const items: InventoryItem[] = []

  for (const id of character.equipment?.armor ?? []) {
    const item = equipmentData.armor.find((a) => a.id === id)
    if (!item) continue
    const ed = item.editionData?.find((e) => e.edition === edition) as ArmorEditionDatum | undefined
    if (ed?.category === 'shields') continue
    items.push({ id, name: item.name })
  }

  return items
}

function getOwnedShields(character: Character): InventoryItem[] {
  const edition = character.edition ?? '5e'
  const items: InventoryItem[] = []

  for (const id of character.equipment?.armor ?? []) {
    const item = equipmentData.armor.find((a) => a.id === id)
    if (!item) continue
    const ed = item.editionData?.find((e) => e.edition === edition) as ArmorEditionDatum | undefined
    if (ed?.category !== 'shields') continue
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
  intrinsicEffects: Effect[]
): LoadoutOption[] {
  const edition = character.edition ?? '5e'
  // if (edition !== '5e') return []

  const context = buildCharacterContext(character)
  const candidateEffects = getEquipmentEffects(character.equipment, edition)

  const armors = getOwnedArmors(character)
  const shields = getOwnedShields(character)

  const armorChoices: (InventoryItem | null)[] = [null, ...armors]
  const shieldChoices: (InventoryItem | null)[] = [null, ...shields]

  const options: LoadoutOption[] = []

  for (const armor of armorChoices) {
    for (const shield of shieldChoices) {
      const loadout: EquipmentLoadout = {
        armorId: armor?.id,
        shieldId: shield?.id,
      }

      const activeEffects = selectActiveEquipmentEffects(candidateEffects, loadout)
      const allEffects = [...intrinsicEffects, ...activeEffects]
      const result = resolveStatDetailed('armor_class', context, allEffects)

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
