import { standardAlignments } from './alignments'
import { FULL_CASTER_SLOTS_5E, HALF_CASTER_SLOTS_5E } from './classes/spellSlotTables'
import type { WealthTier } from './classes/types'

// ---------------------------------------------------------------------------
// Ruleset types
// ---------------------------------------------------------------------------

export type AttackResolution = 'to_hit' | 'thac0' | 'matrix'

export type DerivedCombat = {
  attackResolution: AttackResolution
  thac0?: number
  savingThrows?: Record<string, number>
  armorClass: number
}

export type MulticlassingRules = {
  enabled: boolean
  maxClasses?: number
  minLevelToMulticlass?: number
  abilityScoreRequirements?: Record<string, Record<string, number>>; // by classId
  xpMode?: 'shared' | 'per_class'
}

export type AlignmentOption = {
  id: string;        // stored on character
  name: string;      // display label
  tags?: string[];   // optional: ["lawful","good"]
}

export type AlignmentRules = {
  enabled: boolean;
  options: AlignmentOption[];
  // optional: for UI grouping/validation
  axes?: Array<{
    id: 'ethics' | 'morality' | string;
    values: Array<{ id: string; name: string }>;
  }>;
  defaultId?: string;     // e.g. "n" or "unaligned"
  allowCustom?: boolean;  // if you ever want freeform
}

export type StartingWealthRules = {
  /**
   * How level 1 starting gold is determined.
   * Keep flexible because different systems do different things.
   */
  level1:
    | { mode: 'fixed'; gp: number }
    | { mode: 'by_class'; formulaByClassId: Record<string, string> } // e.g. "5d4*10"
    | { mode: 'by_class'; defaultFormula: string; overrides?: Record<string, string> };

  /**
   * For higher-level starts (or late-join PCs): tiers.
   */
  tiers?: WealthTier[]

  /**
   * Currency + rounding knobs, if you need them later.
   */
  currency?: { base: 'gp' | 'sp' | 'cp' };
}

export type MechanicsRules = {
  progression: Progression
  combat: DerivedCombat
  character: {
    alignment: AlignmentRules
  }
}

export type SpellSlotTable = readonly number[][]

export type SpellcastingProgression = {
  slotTables: {
    fullCaster?: SpellSlotTable
    halfCaster?: SpellSlotTable
    // thirdCaster?: SpellSlotTable
  }
}

export type Progression = {
  multiclassing: MulticlassingRules
  starting: {
    wealth: StartingWealthRules
  },
  spellcasting: SpellcastingProgression
}

export type Patch = unknown
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type ContentPolicy = {
  allowAll?: boolean
  allow?: string[]
  deny?: string[]
  overrides?: Record<id, Patch>
  /** Brand-new campaign-specific resources keyed by id */
  custom?: Record<id, Resource>
}

export type RulesetContent = {
  classes: ContentPolicy
  races: ContentPolicy
  equipment: ContentPolicy
  spells: ContentPolicy
  monsters: ContentPolicy
}

export type Ruleset = {
  _id: string
  campaignId: string
  meta: {
    name: string
    basedOn?: string
    version: number
  }
  content: RulesetContent
  mechanics: MechanicsRules
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const startingWealthTiersDefault: WealthTier[] = [
  { levelRange: [1, 4],   baseGold: 125,  maxItemValue: 75 },
  { levelRange: [5, 10],  baseGold: 500,  maxItemValue: 200 },
  { levelRange: [11, 20], baseGold: 5000, maxItemValue: 2000 }
]

export const ruleSets: Ruleset[] = [
  {
    _id: 'testruleset01',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    meta: { name: 'Lankhmar 5e Ruleset', basedOn: '5e', version: 1 },
    content: {
      classes:    { allowAll: true, deny: ['warlock'] },
      races:      { allowAll: true },
      equipment:  { allowAll: true },
      spells:     { allowAll: true },
      monsters:   { allowAll: true },
    },
    mechanics: {
      progression: {
        multiclassing: {
          enabled: true
        },
        starting: {
          wealth: {
            level1: {
              mode: 'by_class', defaultFormula: '5d4 * 10' 
            },
            tiers: startingWealthTiersDefault
          }
        },
        spellcasting: {
          slotTables: {
            fullCaster: FULL_CASTER_SLOTS_5E,
            halfCaster: HALF_CASTER_SLOTS_5E,
            // thirdCaster: THIRD_CASTER_SLOTS_5E,
          }
        }
      },
      character: {
        alignment: {
          enabled: true,
          defaultId: 'n',
          options: standardAlignments,
        }
      },
      combat: {
        armorClass: 10,
        attackResolution: 'to_hit',
      },
    },
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const ruleSetsById: Record<string, Ruleset> = Object.fromEntries(
  ruleSets.map(r => [r._id, r]),
)

export const defaultRulesetId = 'testruleset01'

export const defaultRuleset: Ruleset = ruleSetsById[defaultRulesetId]
