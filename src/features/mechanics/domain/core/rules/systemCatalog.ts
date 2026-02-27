/**
 * System catalog — the full, unfiltered set of game resources and system
 * ruleset defaults.
 *
 * Game resources are the "base library" that rulesets filter/override via
 * ContentPolicy.  System rulesets are code-defined defaults that campaign
 * patches are applied on top of via `resolveCampaignRuleset`.
 */
import { equipment } from '@/data/equipment/equipment'
import { spells } from '@/data/spells'
import type { SpellData } from '@/data/spells'
import { monsters } from '@/data/monsters'
import { classes } from "@/data/classes"
import type { CharacterClass } from '@/data/classes.types'
import type { WealthTier } from '@/data/classes.types'
import type { Race } from '@/features/content/domain/types'
import { getSystemRaces } from './systemCatalog.races'
import type { WeaponItem } from '@/data/equipment'
import type { ArmorItem } from '@/data/equipment'
import type { GearItem } from '@/data/equipment'
import type { MagicItem } from '@/data/equipment'
import type { EnchantmentTemplate } from '@/data/equipment'
import type { Monster } from '@/data/monsters/monsters.types'
import { standardAlignments } from '@/data/ruleSets/alignments'
import { FULL_CASTER_SLOTS_5E, HALF_CASTER_SLOTS_5E } from '@/data/ruleSets/spellSlotTables'
import type { SystemRuleset, SystemRulesetId } from './ruleset.types'

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

const races = getSystemRaces('5e_v1');

export const systemCatalog: CampaignCatalog = {
  classesById:              keyBy(classes),
  classIds:                 Object.keys(classes),
  racesById:                keyBy(races),
  raceIds:                  races.map(r => r.id),

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
  monstersById:             keyBy(monsters),
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

const SYSTEM_RULESET_5E_V1: SystemRuleset = {
  systemId: '5e_v1',
  meta: {
    name: '5e System Defaults',
    basedOn: '5e',
    version: 1,
  },
  content: {
    classes:    { policy: 'all_except', ids: [] },
    races:      { policy: 'all_except', ids: [] },
    equipment:  { policy: 'all_except', ids: [] },
    spells:     { policy: 'all_except', ids: [] },
    monsters:   { policy: 'all_except', ids: [] },
    locations:  { policy: 'all_except', ids: [] },
  },
  mechanics: {
    progression: {
      multiclassing: {
        mode: 'use_default',
        default: {
          enabled: true,
          minLevelToMulticlass: 2,
          xpMode: 'shared',
          entryRequirementsByTargetClass: {
            sorcerer: {
              anyOf: [{ all: [{ ability: 'charisma', min: 13 }] }],
            },
          },
        },
      },
      starting: {
        wealth: {
          level1: { mode: 'by_class', defaultFormula: '5d4 * 10' },
          tiers: startingWealthTiersDefault,
        },
      },
      spellcasting: {
        slotTables: {
          fullCaster: FULL_CASTER_SLOTS_5E,
          halfCaster: HALF_CASTER_SLOTS_5E,
        },
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
        options: standardAlignments,
      },
    },
    combat: {
      armorClass: 10,
      attackResolution: 'to_hit',
    },
  },
};

// ---------------------------------------------------------------------------
// System ruleset registry
// ---------------------------------------------------------------------------

export const SYSTEM_RULESETS: Record<SystemRulesetId, SystemRuleset> = {
  '5e_v1': SYSTEM_RULESET_5E_V1,
};

export function getSystemRuleset(systemId: SystemRulesetId): SystemRuleset {
  const system = SYSTEM_RULESETS[systemId];
  if (!system) {
    throw new Error(`Unknown system ruleset: ${systemId}`);
  }
  return system;
}
