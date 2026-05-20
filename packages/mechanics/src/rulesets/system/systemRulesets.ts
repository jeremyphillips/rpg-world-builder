/**
 * System ruleset defaults (no SRD catalog data). Safe to import on the app entry path.
 */
import type { WealthTier } from '@/features/content/classes/domain/types'
import {
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  PACT_CASTER_SLOTS,
} from '@/features/mechanics/domain/progression/class'
import { CHARACTER_PROFICIENCY_BONUS_TABLE } from '@/features/mechanics/domain/progression/proficiency/proficiencyBonusTable'
import type { SystemRuleset, SystemRulesetId } from '../types/ruleset.types'
import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds'

export const startingWealthTiersDefault: WealthTier[] = [
  { levelRange: [1, 4], baseGold: 125, maxItemValue: 75 },
  { levelRange: [5, 10], baseGold: 500, maxItemValue: 200 },
  { levelRange: [11, 20], baseGold: 5000, maxItemValue: 2000 },
]

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
    classes: { policy: 'all_except', ids: [] },
    races: { policy: 'all_except', ids: [] },
    equipment: { policy: 'all_except', ids: [] },
    spells: { policy: 'all_except', ids: [] },
    monsters: { policy: 'all_except', ids: [] },
    locations: { policy: 'all_except', ids: [] },
    skillProficiencies: { policy: 'all_except', ids: [] },
  },
  mechanics: {
    progression: {
      proficiencyBonusTable: CHARACTER_PROFICIENCY_BONUS_TABLE,
      xp: {
        enabled: true,
        tableId: 'standard',
        mode: 'shared',
      },
      multiclassing: {
        mode: 'use_default',
        default: {
          enabled: true,
          minLevelToMulticlass: 2,
          xpMode: 'shared',
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
          { levelRange: [1, 4], maxRarity: 'uncommon', permanentItems: 2, consumableItems: 9 },
          { levelRange: [5, 10], maxRarity: 'rare', permanentItems: 6, consumableItems: 28 },
          { levelRange: [11, 16], maxRarity: 'very-rare', permanentItems: 6, consumableItems: 24 },
          { levelRange: [17, 20], maxRarity: 'legendary', permanentItems: 6, consumableItems: 19 },
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
}

export const SYSTEM_RULESETS: Record<SystemRulesetId, SystemRuleset> = {
  [DEFAULT_SYSTEM_RULESET_ID]: SYSTEM_RULESET_SRD_CC_V5_2_1,
}

export function getSystemRuleset(systemId: SystemRulesetId): SystemRuleset {
  const system = SYSTEM_RULESETS[systemId]
  if (!system) {
    throw new Error(`Unknown system ruleset: ${systemId}`)
  }
  return system
}
