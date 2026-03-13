import type { AbilityId } from "@/features/mechanics/domain/core/character/abilities.types";
import type { MonsterEffect, MonsterTriggeredSave } from "./monster-effects.types";
import type { ConditionId, DamageType } from "./monster-combat.types";
import type { EffectDuration, EffectUses } from "@/features/mechanics/domain/effects/timing.types";

export type MonsterTraitActionModifier = {
  actionName: string;
  trigger: {
    kind: 'enters_space';
  };
  saveModifier?: 'advantage' | 'disadvantage';
};

export type MonsterTraitCheckRule = {
  name?: string;
  actor: 'nearby-creature';
  distanceFeet?: number;
  actionRequired?: boolean;
  check: {
    ability: AbilityId;
    skill?: string;
    dc: number;
  };
  onSuccess?: MonsterEffect[];
  onFail?: MonsterEffect[];
  target?: 'creature-inside' | 'object-inside';
};

type MonsterContainmentRule = {
  fillsEntireSpace?: boolean;
  canContainCreatures?: boolean;
  creatureCover?: 'total-cover';
  capacity?: {
    large?: number;
    mediumOrSmall?: number;
  };
};

type MonsterVisibilityRule = {
  transparent?: boolean;
  noticeCheck?: {
    ability: AbilityId;
    skill?: string;
    dc: number;
    unlessWitnessedMoveOrAction?: boolean;
  };
};

export type MonsterTraitRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: DamageType; min?: number }
  | { kind: 'hit-points-equals'; value: number };

export type MonsterTraitTrigger =
  | { kind: 'turn_start' }
  | { kind: 'turn_end' }
  | {
      kind: 'ally_near_target';
      withinFeet: number;
      allyConditionNot?: ConditionId;
    }
  | {
      kind: 'in_environment';
      environment: 'sunlight';
    }
  | {
      kind: 'in_form';
      form: 'object' | 'true-form';
    }
  | {
      kind: 'while_moving_grappled_creature';
    }
  | {
      kind: 'reduced_to_0_hp';
    }
  | {
      kind: 'contact';
    };

export type MonsterTrait = {
  name: string;
  description: string;
  trigger?: MonsterTraitTrigger | MonsterTraitTrigger[];
  requirements?: MonsterTraitRequirement[];
  save?: MonsterTriggeredSave;
  effects?: MonsterEffect[];
  modifiesAction?: MonsterTraitActionModifier[];
  checks?: MonsterTraitCheckRule[];
  containment?: MonsterContainmentRule;
  visibility?: MonsterVisibilityRule;
  uses?: EffectUses
  suppression?: {
    ifTookDamageTypes?: DamageType[];
    duration: EffectDuration;
  }
  notes?: string;
};
