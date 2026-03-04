import type {
  ResolveMode,
  RuleOverrideMap,
  RuleConfig,
  ArrayMergeMode,
  MergePolicy,
} from '@/features/mechanics/domain/core/rules/ruleConfig';
import type { WealthTier } from '@/data/classes.types';
import type { MagicItemRarity } from '@/features/content/domain/types';
import type { AbilityId } from '@/features/mechanics/domain/core/character';
import type { XpTable } from '@/features/mechanics/domain/core/progression/xp/xp.types';
import type { Coin } from '../money';

export type {
  ResolveMode,
  RuleOverrideMap,
  RuleConfig,
  ArrayMergeMode,
  MergePolicy,
};

// ---------------------------------------------------------------------------
// Ruleset types
// ---------------------------------------------------------------------------

export type AttackResolution = 'to_hit' | 'thac0' | 'matrix';

export type DerivedCombat = {
  attackResolution: AttackResolution;
  thac0?: number;
  savingThrows?: Record<string, number>;
  armorClass: number;
};

export type ClassId = string;
export type RaceId = string;

export type AbilityRequirement = {
  ability: AbilityId;
  min: number;
};

/**
 * One AND group: all requirements must be met
 */
export type AbilityRequirementGroup = {
  all: AbilityRequirement[];
};

/**
 * OR across groups: any group can satisfy the requirement
 */
export type ClassEntryRequirement = {
  anyOf: AbilityRequirementGroup[];
};

export type MulticlassingRuleSet = {
  enabled: boolean;
  maxClasses?: number;
  minLevelToMulticlass?: number;
  /**
   * Requirements to take the first level in the *target* class.
   * Keyed by target classId.
   */
  defaultEntryRequirement?: ClassEntryRequirement;
  entryRequirementsByTargetClass?: Record<ClassId, ClassEntryRequirement>;
  xpMode?: 'shared' | 'per_class';
};

export type MulticlassingRules = RuleConfig<
  MulticlassingRuleSet,
  Partial<MulticlassingRuleSet>
>;

export type AlignmentOption = {
  id: string;
  name: string;
  tags?: string[];
};

export type AlignmentList = AlignmentOption[];

export type AlignmentOptionSetId = 'nine_point' | 'five_point' | 'three_point';

export type AlignmentRules = {
  enabled: boolean;
  optionSetId: AlignmentOptionSetId;
  axes?: Array<{
    id: 'ethics' | 'morality' | string;
    values: Array<{ id: string; name: string }>;
  }>;
  defaultId?: string;
  allowCustom?: boolean;
};

export type StartingWealthRules = {
  level1:
    | { mode: 'fixed'; gp: number }
    | { mode: 'by_class'; formulaByClassId: Record<string, string> }
    | { mode: 'by_class'; defaultFormula: string; overrides?: Record<string, string> };
  tiers?: WealthTier[];
  currency?: { base: Coin };
};

export type LevelingRules = {
  levelCap: number;
  mode: 'xp' | 'milestone';
  xpTable?: XpTable;
};

export type ProficiencyRules = {
  bonusByLevel: number[];
};

export type AbilityRules = {
  ids: AbilityId[];
  mod: { kind: '5e_default' };
};

export type RestRules = {
  shortRestMinutes: number;
  longRestMinutes: number;
  hitDiceRecoveryOnLongRest: { kind: 'half_total' | 'all' | 'none' };
};

export type XpRules = {
  enabled: boolean;
  tableId: 'standard';
  mode: 'shared' | 'per_class';
};

export type MechanicsRules = {
  progression: Progression;
  combat: DerivedCombat;
  character: {
    alignment: AlignmentRules;
    abilities?: AbilityRules;
    proficiency?: ProficiencyRules;
  };
  resting?: RestRules;
};

export type SpellSlotTable = readonly number[][];

export type SpellcastingProgression = {
  slotTables: {
    fullCaster?: SpellSlotTable;
    halfCaster?: SpellSlotTable;
  };
};

export interface MagicItemBudgetTier {
  levelRange: [number, number];
  maxRarity?: MagicItemRarity;
  permanentItems: number;
  consumableItems: number;
  maxAttunement?: number;
  maxItemValueGp?: number;
}

export type MagicItemBudget = {
  maxAttunement?: number;
  tiers: MagicItemBudgetTier[];
};

export type Progression = {
  multiclassing: MulticlassingRules;
  starting: {
    wealth: StartingWealthRules;
  };
  leveling?: LevelingRules;
  spellcasting: SpellcastingProgression;
  magicItemBudget: MagicItemBudget;
  xp: XpRules;
  overrides?: {
    byClassId?: Record<string, {
      levelCap?: number;
      xpTable?: Array<{ level: number; xpRequired: number }>;
      startingWealthFormula?: string;
    }>;
  };
};

export type Patch = unknown;
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type ContentPolicy = 'all_except' | 'only';

export type ContentRule = {
  policy: ContentPolicy;
  ids: string[];
  // TODO: figure out if this is needed
  overrides?: Record<string, Patch>;
  custom?: Record<string, unknown>;
};

export type RulesetContent = {
  classes: ContentRule;
  races: ContentRule;
  equipment: ContentRule;
  spells: ContentRule;
  monsters: ContentRule;
  locations: ContentRule;
};

export type CampaignTagOption = {
  id: string;
  name: string;
  description?: string;
};

export type CampaignTagCategory = {
  id: string;
  name: string;
  options: CampaignTagOption[];
};

export type CampaignTagsOptions = CampaignTagCategory[];

export type CampaignTagsState = {
  selected: string[];
  allowCustom?: boolean;
  custom?: string[];
};

export type CampaignTagsConfig = CampaignTagCategory[];

export type Ruleset = {
  _id: string;
  campaignId: string;
  meta: {
    name: string;
    basedOn?: string;
    version: number;
    campaignTags?: CampaignTagsState;
  };
  content: RulesetContent;
  mechanics: MechanicsRules;
};

export type CampaignTagsVM = CampaignTagsState & {
  options: CampaignTagsOptions;
};
