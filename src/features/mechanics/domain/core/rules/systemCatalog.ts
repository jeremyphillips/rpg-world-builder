/**
 * System catalog — the full, unfiltered set of game resources.
 *
 * This is the "base library" that rulesets filter/override via ContentPolicy.
 * All entries are indexed by `id` for O(1) lookup.
 */
import { classes } from '@/data/classes'
import { races } from '@/data/races'
import { equipment } from '@/data/equipment'
import { spells } from '@/data/classes/spells/spells'
import { monsters } from '@/data/monsters'

import type { CharacterClass } from '@/data/classes/types'
import type { Race } from '@/data/types'
import type { WeaponItem } from '@/data/equipment/weapons.types'
import type { ArmorItem } from '@/data/equipment/armor.types'
import type { GearItem } from '@/data/equipment/gear.types'
import type { MagicItem } from '@/data/equipment/magicItems.types'
import type { EnchantmentTemplate } from '@/data/equipment/enchantments/enchantmentTemplates.types'
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
  racesById:                Record<string, Race>
  weaponsById:              Record<string, WeaponItem>
  armorById:                Record<string, ArmorItem>
  gearById:                 Record<string, GearItem>
  magicItemsById:           Record<string, MagicItem>
  enhancementTemplatesById: Record<string, EnchantmentTemplate>
  spellsById:               Record<string, Spell>
  monstersById:             Record<string, Monster>
}

// ---------------------------------------------------------------------------
// System catalog (singleton — full unfiltered data)
// ---------------------------------------------------------------------------

export const systemCatalog: CampaignCatalog = {
  classesById:              keyBy(classes),
  racesById:                keyBy(races),
  weaponsById:              keyBy(equipment.weapons),
  armorById:                keyBy(equipment.armor),
  gearById:                 keyBy(equipment.gear),
  magicItemsById:           keyBy(equipment.magicItems),
  enhancementTemplatesById: keyBy(equipment.enchantments.enhancementTemplates),
  spellsById:               keyBy(spells),
  monstersById:             keyBy(monsters),
}
