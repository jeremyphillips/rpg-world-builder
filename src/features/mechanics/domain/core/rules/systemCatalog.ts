/**
 * System catalog — the full, unfiltered set of game resources.
 *
 * This is the "base library" that rulesets filter/override via ContentPolicy.
 * All entries are indexed by `id` for O(1) lookup.
 */
// import { classes } from '@/data/classes'
// import { races } from '@/data/races'
import { equipmentCore } from '@/data/equipmentCore/equipmentCore'
import { spells } from '@/data/classes/spells/spells'
import { spellsCore } from '@/data/spellsCore'
import type { Spell as SpellCore } from '@/data/spellsCore'
import { monsters } from '@/data/monsters'
import { classesCore } from "@/data/classes.core"
import { racesCore } from "@/data/races.core"
import type { CharacterClass } from '@/data/classes/types'
import type { Race } from '@/data/types'
import type { WeaponItem } from '@/data/equipment/weapons.types'
import type { ArmorItem } from '@/data/equipment/armor.types'
import type { GearItem } from '@/data/equipment/gear.types'
import type { MagicItem } from '@/data/equipment/magicItems.types'
import type { EnchantmentTemplate } from '@/data/equipmentCore/enchantments/enchantmentTemplates.types'
import type { Spell } from '@/data/classes/spells/spells.types'
import type { Monster } from '@/data/monsters/monsters.types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function keyBy<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  const map: Record<string, T> = {}
  for (const item of items) {
    map[item.id] = item
  }
  return map
}

// ---------------------------------------------------------------------------
// Catalog shape
// ---------------------------------------------------------------------------

export type CampaignCatalog = {
  classesById:              Record<string, CharacterClass>
  classIds:                 readonly string[]

  racesById:                Record<string, Race>
  raceIds:                  readonly string[]

  weaponsById:              Record<string, WeaponItem>
  armorById:                Record<string, ArmorItem>
  gearById:                 Record<string, GearItem>
  magicItemsById:           Record<string, MagicItem>
  enhancementTemplatesById: Record<string, EnchantmentTemplate>
  /** @deprecated Use spellsCoreById — edition-based spell data */
  spellsById:               Record<string, Spell>
  spellsCoreById:           Record<string, SpellCore>
  monstersById:             Record<string, Monster>
}

// ---------------------------------------------------------------------------
// System catalog (singleton — full unfiltered data)
// ---------------------------------------------------------------------------

export const systemCatalog: CampaignCatalog = {
  // classesById:              keyBy(classes),
  classesById:              keyBy(classesCore),
  classIds:                 Object.keys(classesCore),
  //racesById:                keyBy(races),
  racesById:                keyBy(racesCore),
  raceIds:                  Object.keys(racesCore),

  // weaponsById:              keyBy(equipment.weapons),
  weaponsById:              keyBy(equipmentCore.weapons),
  // armorById:                keyBy(equipment.armor),
  armorById:                keyBy(equipmentCore.armor),

  // gearById:                 keyBy(equipment.gear),
  gearById:                 keyBy(equipmentCore.gear),
  // magicItemsById:           keyBy(equipment.magicItems),
  magicItemsById:           keyBy(equipmentCore.magicItems),

  enhancementTemplatesById: keyBy(equipmentCore.enchantments.enhancementTemplates),
  spellsById:               keyBy(spells),
  spellsCoreById:           keyBy(spellsCore),
  monstersById:             keyBy(monsters),
}
