import type { DieFace } from '@/shared/domain/dice';
import type {
  ContentId,
  ContentSummary,
  ContentItem,
  ContentInput,
} from '@/features/content/shared/domain/types/content.types';
import type { MonsterAbilityScoreMap } from '@/features/mechanics/domain/character';
import type { ProficiencyBonus } from '@/shared/domain/proficiency';
import type { CreatureProficiencyGroups } from '@/shared/domain/proficiency/authoredCreatureProficiencies';
import type { AlignmentId } from "@/features/content/shared/domain/types";
import type { CreatureTypeId, CreatureSizeId, CreatureSubtypeId } from '@/features/content/creatures/domain/values';

import type { MonsterEquipment, MonsterArmorClass } from "./monster-equipment.types";
import type { MonsterSenses } from "./monster-senses.types";
import type { MonsterTrait } from "./monster-traits.types";
import type { MonsterAction } from "./monster-actions.types";
import type { MonsterLegendaryActions } from "./monster-legendary.types";
import type { ContentResolutionMeta } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type {
  CreatureResistanceDamageType,
  CreatureVulnerabilityDamageType,
  ImmunityType,
} from '@/features/mechanics/domain/creatures/immunities.types';
import type { Movement } from "@/features/mechanics/domain/movement";

// TODO: create dynamic type
export type MonsterId = ContentId;

export type IntelligenceCategory =
  | 'non'
  | 'semi'
  | 'animal'
  | 'low'
  | 'average'
  | 'very'
  | 'high'
  | 'exceptional'
  | 'low-to-average'
  | 'low-to-very'
  | 'semi-to-average';

type MonsterLanguage = {
  id: string;
  speaks?: boolean;
};

export type MonsterType = CreatureTypeId
export type MonsterSizeCategory = CreatureSizeId
export type MonsterSubtype = CreatureSubtypeId

export type MonsterChallengeRating =
  | 0 | 0.125 | 0.25 | 0.5 | 1
  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
  | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30;

export type MonsterProficiencies = CreatureProficiencyGroups;

export interface MonsterFields {
  id: string;
  imageKey?: string;
  name: string;
  type?: MonsterType;
  subtype?: MonsterSubtype;
  sizeCategory?: MonsterSizeCategory;
  languages?: MonsterLanguage[];
  description?: {
    short?: string;
    long?: string;
  };

  mechanics: {
    hitPoints: {
      count: number;
      die: DieFace;
      modifier?: number;
    };
    armorClass: MonsterArmorClass;
    movement: Movement;
    abilities?: MonsterAbilityScoreMap;
    traits?: MonsterTrait[];
    actions?: MonsterAction[];
    bonusActions?: MonsterAction[];
    legendaryActions?: MonsterLegendaryActions;
    senses?: MonsterSenses;
    proficiencies?: MonsterProficiencies;
    proficiencyBonus: ProficiencyBonus;
    equipment?: MonsterEquipment;
    immunities?: ImmunityType[];
    resistances?: CreatureResistanceDamageType[];
    vulnerabilities?: CreatureVulnerabilityDamageType[];
    /** Optional whole-stat-block resolution metadata; prefer per-trait/action `resolution` when possible. */
    resolution?: ContentResolutionMeta;
    /**
     * Optional encounter stealth permissions (same shape as combatant `skillRuntime.hideEligibilityFeatureFlags`).
     * Authored on homebrew / special stat blocks; not a generalized trait engine.
     */
    hideEligibilityFeatureFlags?: {
      allowHalfCoverForHide?: boolean;
      allowDimLightHide?: boolean;
      allowMagicalConcealmentHide?: boolean;
      allowDifficultTerrainHide?: boolean;
      allowHighWindHide?: boolean;
    };
  };

  lore: {
    alignment?: AlignmentId;
    xpValue: number;
    challengeRating: MonsterChallengeRating;
    intelligence?: IntelligenceCategory;
  }
}

export type Monster = ContentItem & MonsterFields;

export type MonsterSummary = ContentSummary & MonsterFields & {
  /** Whether this Monster is enabled for the campaign (from content rule). */
  allowedInCampaign?: boolean;
};

export type MonsterInput = ContentInput & Partial<MonsterFields>;
