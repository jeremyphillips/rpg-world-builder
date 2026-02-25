/**
 * System catalog — the full, unfiltered set of game resources.
 *
 * This is the "base library" that rulesets filter/override via ContentPolicy.
 * All entries are indexed by `id` for O(1) lookup.
 */
import { equipment } from '@/data/equipment/equipment'
import { spells } from '@/data/spells'
import type { SpellData } from '@/data/spells'
import { monsters } from '@/data/monsters'
import { classes } from "@/data/classes"
import { races } from "@/data/races"
import type { CharacterClass } from '@/data/classes.types'
import type { Race } from '@/data/types'
import type { WeaponItem } from '@/data/equipment'
import type { ArmorItem } from '@/data/equipment'
import type { GearItem } from '@/data/equipment'
import type { MagicItem } from '@/data/equipment'
import type { EnchantmentTemplate } from '@/data/equipment'
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
  
  spellsById:               Record<string, SpellData>
  monstersById:             Record<string, Monster>
}

// ---------------------------------------------------------------------------
// System catalog (singleton — full unfiltered data)
// ---------------------------------------------------------------------------

export const systemCatalog: CampaignCatalog = {
  // classesById:              keyBy(classes),
  classesById:              keyBy(classes),
  classIds:                 Object.keys(classes),
  //racesById:                keyBy(races),
  racesById:                keyBy(races),
  raceIds:                  Object.keys(races),

  // weaponsById:              keyBy(equipment.weapons),
  weaponsById:              keyBy(equipment.weapons),
  // armorById:                keyBy(equipment.armor),
  armorById:                keyBy(equipment.armor),

  // gearById:                 keyBy(equipment.gear),
  gearById:                 keyBy(equipment.gear),
  // magicItemsById:           keyBy(equipment.magicItems),
  magicItemsById:           keyBy(equipment.magicItems),

  enhancementTemplatesById: keyBy(equipment.enchantments.enhancementTemplates),
  spellsById:               keyBy(spells),
  spellsById:           keyBy(spells),
  monstersById:             keyBy(monsters),
}
