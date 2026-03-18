import type { Effect } from '../effects.types'
import type { Equipment, EquipmentLoadout } from '@/features/character/domain/types'
import { getSystemArmor } from '@/features/mechanics/domain/rulesets/system/armor'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import {
  getCreatureArmorBonusValue,
  getCreatureArmorFormulaDefinition,
  type CreatureArmorCatalogEntry,
} from '@/features/mechanics/domain/equipment/armorClass'
import { effectSource, matchesSourceCategory } from '../source'
import type { ResolvedEquipmentLoadout } from '@/features/mechanics/domain/equipment/loadout'

export type { ResolvedSlot, ResolvedEquipmentLoadout } from '@/features/mechanics/domain/equipment/loadout'
export {
  resolveLoadout,
  resolveEquipmentLoadoutDetailed,
  resolveWieldedWeaponIds,
} from '@/features/mechanics/domain/equipment/loadout'

// ---------------------------------------------------------------------------
// Armor lookup
// ---------------------------------------------------------------------------

function findCoreArmor(
  armorId: string,
  armorById?: Record<string, CreatureArmorCatalogEntry>,
) {
  if (armorById) {
    return armorById[armorId] ?? null
  }
  const systemArmor = getSystemArmor(DEFAULT_SYSTEM_RULESET_ID)
  return systemArmor.find((a) => a.id === armorId) ?? null
}

function buildArmorFormulaEffect(
  armor: CreatureArmorCatalogEntry,
  source: string
): Effect {
  return {
    kind: 'formula',
    target: 'armor_class',
    formula: getCreatureArmorFormulaDefinition(armor),
    source,
  } as Effect
}

/**
 * Pure translation layer: equipment bag → flat Effect[].
 *
 * Produces effects for ALL owned items:
 *  - FormulaEffect per armor (base AC + ability + dex cap)
 *  - ModifierEffect per shield (+AC bonus)
 *
 * Each effect is tagged with `source` using the convention:
 *  - 'armor:<itemId>'
 *  - 'shield:<itemId>'
 */
export function getEquipmentEffects(
  equipment: Equipment | undefined,
  armorById?: Record<string, CreatureArmorCatalogEntry>,
): Effect[] {
  const ownedArmorIds = equipment?.armor ?? []
  const effects: Effect[] = []

  for (const id of ownedArmorIds) {
    const item = findCoreArmor(id, armorById)
    if (!item) continue

    if (item.category === 'shields') {
      const bonus = getCreatureArmorBonusValue(item)
      if (bonus > 0) {
        effects.push({
          kind: 'modifier',
          target: 'armor_class',
          mode: 'add',
          value: bonus,
          source: effectSource('shield', id),
        })
      }
    } else {
      effects.push(buildArmorFormulaEffect(item, effectSource('armor', id)))
    }
  }

  return effects
}

/**
 * Filter candidate equipment effects down to only the active loadout.
 *
 * Accepts either a flat `EquipmentLoadout` or a `ResolvedEquipmentLoadout`.
 */
export function selectActiveEquipmentEffects(
  candidateEffects: Effect[],
  loadout: EquipmentLoadout | ResolvedEquipmentLoadout | undefined
): Effect[] {
  let armorBaseId: string | undefined
  let shieldBaseId: string | undefined

  if (loadout && 'armor' in loadout) {
    armorBaseId = (loadout as ResolvedEquipmentLoadout).armor.baseId
    shieldBaseId = (loadout as ResolvedEquipmentLoadout).shield.baseId
  } else {
    armorBaseId = (loadout as EquipmentLoadout | undefined)?.armorId
    shieldBaseId = (loadout as EquipmentLoadout | undefined)?.shieldId
  }

  const activeArmorSource = armorBaseId ? effectSource('armor', armorBaseId) : null
  const activeShieldSource = shieldBaseId ? effectSource('shield', shieldBaseId) : null

  return candidateEffects.filter((e) => {
    if (!e.source) return true
    if (matchesSourceCategory(e.source, 'armor')) return e.source === activeArmorSource
    if (matchesSourceCategory(e.source, 'shield')) return e.source === activeShieldSource
    return true
  })
}
