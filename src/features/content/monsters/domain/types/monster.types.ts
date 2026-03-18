import type { DieFace } from "@/features/mechanics/domain/dice";
import type {
  ContentId,
  ContentSummary,
  ContentItem,
  ContentInput,
} from '@/features/content/shared/domain/types/content.types';
import type { AbilityScoreMap, AbilityId } from '@/features/mechanics/domain/character';
import type { AlignmentId } from "@/features/content/shared/domain/types";
import type { MonsterType, MonsterSizeCategory } from "@/features/content/monsters/domain/vocab/monster.vocab";
import type {
  CharacterProficiencies,
  ProficiencySkillAdjustment,
  ProficiencyWeaponAdjustment
} from "@/features/character/domain/types";
import type { MonsterEquipment, MonsterArmorClass } from "./monster-equipment.types";
import type { MonsterSenses } from "./monster-senses.types";
import type { MonsterTrait } from "./monster-traits.types";
import type { MonsterAction } from "./monster-actions.types";
import type { ImmunityType, VulnerabilityType } from "./monster-combat.types";
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

export type MonsterSubtype =
  | 'aquatic'
  | 'gnome';

export type MonsterChallengeRating =
  | 0 | 0.125 | 0.25 | 0.5 | 1
  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
  | 19 | 20 | 21 | 22 | 23 | 24;

export type MonsterProficiencies = CharacterProficiencies & {
  weapons?: Record<string, ProficiencyWeaponAdjustment>;
};

export interface MonsterFields {
  id: string;
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
    abilities?: AbilityScoreMap;
    savingThrows?: Partial<Record<AbilityId, ProficiencySkillAdjustment>>;
    traits?: MonsterTrait[];
    actions?: MonsterAction[];
    bonusActions?: MonsterAction[];
    senses?: MonsterSenses;
    proficiencies?: MonsterProficiencies;
    proficiencyBonus: number;
    equipment?: MonsterEquipment;
    immunities?: ImmunityType[];
    vulnerabilities?: VulnerabilityType[];
  };

  lore: {
    alignment?: AlignmentId;
    xpValue?: number;
    challengeRating?: MonsterChallengeRating;
    intelligence?: IntelligenceCategory;
  }
}

export type Monster = ContentItem & MonsterFields;

export type MonsterSummary = ContentSummary & MonsterFields & {
  /** Whether this Monster is enabled for the campaign (from content rule). */
  allowedInCampaign?: boolean;
};

export type MonsterInput = ContentInput & Partial<MonsterFields>;
