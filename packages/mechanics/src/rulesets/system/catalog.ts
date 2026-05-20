/**
 * System catalog — the full, unfiltered set of game resources and system
 * ruleset defaults.
 *
 * Game resources are the "base library" that rulesets filter/override via
 * ContentPolicy.  System rulesets are code-defined defaults that campaign
 * patches are applied on top of via `resolveCampaignRuleset`.
 */
import { getSystemEnchantmentTemplates } from './enchantments'
import { getSystemWeapons } from './weapons'
import { getSystemArmor } from './armor'
import { getSystemGear } from './gear'
import { getSystemMagicItems } from './magicItems'
import { getSystemSpells } from './spells'
import { getSystemSkillProficiencies } from './skillProficiencies'
import { getSystemClasses } from './classes'
import type { Spell } from '@/features/content/spells/domain/types'
import type { SkillProficiency } from '@/features/content/skillProficiencies/domain/types'
import { getSystemMonsters } from './monsters'
import type { CharacterClass } from '@/features/content/classes/domain/types'
import type { Armor } from '@/features/content/equipment/armor/domain/types'
import type { Gear } from '@/features/content/equipment/gear/domain/types'
import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types'
import type { Race } from '@/features/content/races/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types'
import { getSystemRaces } from './races'
import type { EnchantmentTemplate } from '@/features/content/enchantments/domain/types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'

export {
  getSystemRuleset,
  SYSTEM_RULESETS,
  startingWealthTiersDefault,
} from './systemRulesets'

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
  raceIds:                  readonly Race['id'][]
  weaponsById:              Record<string, Weapon>
  armorById:                Record<string, Armor>
  gearById:                 Record<string, Gear>
  magicItemsById:           Record<string, MagicItem>
  enhancementsById:         Record<string, EnchantmentTemplate>
  spellsById:               Record<string, Spell>
  skillProficienciesById:   Record<string, SkillProficiency>
  skillProficiencyIds:      readonly string[]
  monstersById:             Record<string, Monster>
}

// ---------------------------------------------------------------------------
// System catalog (singleton — full unfiltered data)
// ---------------------------------------------------------------------------

const races = getSystemRaces(DEFAULT_SYSTEM_RULESET_ID);

const weapons = getSystemWeapons(DEFAULT_SYSTEM_RULESET_ID);
const armor = getSystemArmor(DEFAULT_SYSTEM_RULESET_ID);
const gear = getSystemGear(DEFAULT_SYSTEM_RULESET_ID);
const magicItems = getSystemMagicItems(DEFAULT_SYSTEM_RULESET_ID);

const classes = getSystemClasses(DEFAULT_SYSTEM_RULESET_ID);
const skillProficiencies = getSystemSkillProficiencies(DEFAULT_SYSTEM_RULESET_ID);

export const systemCatalog: CampaignCatalog = {
  classesById:      keyBy(classes),
  classIds:         classes.map((c) => c.id),
  racesById:        keyBy(races),
  raceIds:          races.map(r => r.id),
  weaponsById:      keyBy(weapons),
  armorById:        keyBy(armor),
  gearById:         keyBy(gear),
  magicItemsById:   keyBy(magicItems),
  enhancementsById: keyBy(getSystemEnchantmentTemplates(DEFAULT_SYSTEM_RULESET_ID)),
  spellsById:       keyBy(getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)),
  skillProficienciesById: keyBy(skillProficiencies),
  skillProficiencyIds:      skillProficiencies.map((s) => s.id),
  monstersById:     keyBy(getSystemMonsters(DEFAULT_SYSTEM_RULESET_ID)),
}
