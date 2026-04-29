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
import type { WealthTier } from '@/features/content/classes/domain/types'
import type { Armor } from '@/features/content/equipment/armor/domain/types'
import type { Gear } from '@/features/content/equipment/gear/domain/types'
import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types'
import type { Race } from '@/features/content/races/domain/types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types'
import { getSystemRaces } from './races'
import type { EnchantmentTemplate } from '@/features/content/enchantments/domain/types'
import type { Monster } from '@/features/content/monsters/domain/types'
import {
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_CASTER_SLOTS,
} from '@/features/mechanics/domain/progression/class'
import { CHARACTER_PROFICIENCY_BONUS_TABLE } from '@/features/mechanics/domain/progression/proficiency/proficiencyBonusTable'
import type { SystemRuleset, SystemRulesetId } from '../types/ruleset.types'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'

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

// ---------------------------------------------------------------------------
// System rulesets — code-defined rule defaults
//
// Each system ruleset represents the "factory settings" for a game system.
// Campaign patches are applied on top via resolveCampaignRuleset().
// ---------------------------------------------------------------------------

export const startingWealthTiersDefault: WealthTier[] = [
  { levelRange: [1, 4],   baseGold: 125,  maxItemValue: 75 },
  { levelRange: [5, 10],  baseGold: 500,  maxItemValue: 200 },
  { levelRange: [11, 20], baseGold: 5000, maxItemValue: 2000 },
];

const SYSTEM_RULESET_SRD_CC_V5_2_1: SystemRuleset = {
  systemId: DEFAULT_SYSTEM_RULESET_ID,
  meta: {
    name: 'D&D 5e SRD (CC) v5.2.1',
    basedOn: '5e',
    version: 1,
    license: 'CC-BY-4.0',
    source: 'SRD',
    srdVersion: '5.2.1',
  },
  content: {
    classes:    { policy: 'all_except', ids: [] },
    races:      { policy: 'all_except', ids: [] },
    equipment:  { policy: 'all_except', ids: [] },
    spells:     { policy: 'all_except', ids: [] },
    monsters:   { policy: 'all_except', ids: [] },
    locations:  { policy: 'all_except', ids: [] },
    skillProficiencies: { policy: 'all_except', ids: [] },
  },
  mechanics: {
    progression: {
      proficiencyBonusTable: CHARACTER_PROFICIENCY_BONUS_TABLE,
      xp: {
        enabled: true,
        tableId: 'standard',
        mode: 'shared'
      },
      multiclassing: {
        mode: 'use_default',
        default: {
          enabled: true,
          minLevelToMulticlass: 2,
          xpMode: 'shared',
          // Test patch: do not remove this comment
          // entryRequirementsByTargetClass: {
          //   sorcerer: {
          //     anyOf: [{ all: [{ ability: 'charisma', min: 13 }] }],
          //   },
          // },
        },
      },
      starting: {
        wealth: {
          level1: { mode: 'by_class', defaultFormula: '5d4 * 10' },
          tiers: startingWealthTiersDefault,
        },
      },
      spellcasting: {
        full: { slotTable: FULL_CASTER_SLOTS, maxSpellLevel: 9 },
        half: { slotTable: HALF_CASTER_SLOTS, maxSpellLevel: 5 },
        pact: { slotTable: PACT_CASTER_SLOTS, maxSpellLevel: 5 },
      },
      magicItemBudget: {
        maxAttunement: 3,
        tiers: [
          { levelRange: [1, 4],   maxRarity: 'uncommon',  permanentItems: 2,  consumableItems: 9 },
          { levelRange: [5, 10],  maxRarity: 'rare',      permanentItems: 6,  consumableItems: 28 },
          { levelRange: [11, 16], maxRarity: 'very-rare', permanentItems: 6,  consumableItems: 24 },
          { levelRange: [17, 20], maxRarity: 'legendary', permanentItems: 6,  consumableItems: 19 },
        ],
      },
    },
    character: {
      alignment: {
        enabled: true,
        defaultId: 'n',
        optionSetId: 'nine_point',
      },
    },
    combat: {
      armorClass: 10,
      attackResolution: 'to_hit',
      encounter: {
        suppressSameSideHostile: true,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// System ruleset registry
// ---------------------------------------------------------------------------

export const SYSTEM_RULESETS: Record<SystemRulesetId, SystemRuleset> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_RULESET_SRD_CC_V5_2_1,
};

export function getSystemRuleset(systemId: SystemRulesetId): SystemRuleset {
  const system = SYSTEM_RULESETS[systemId];
  if (!system) {
    throw new Error(`Unknown system ruleset: ${systemId}`);
  }
  return system;
}
