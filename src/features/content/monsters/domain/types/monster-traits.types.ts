import type { AbilityId } from "@/features/mechanics/domain/core/character/abilities.types";
import type { MonsterEffect, MonsterTriggeredSave } from "./monster-effects.types";
import type { ConditionId, DamageType } from "./monster-combat.types";

export type MonsterTraitActionModifier = {
  actionName: string;
  trigger: {
    kind: 'enters-space';
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

export type MonsterTraitRule =
  | {
      kind: 'hold-breath';
      duration: {
        value: number;
        unit: 'round' | 'minute' | 'hour' | 'day';
      };
    }
  | {
      kind: 'tracked-part';
      part: 'head' | 'limb';
      initialCount: number;
      loss?: {
        trigger: 'damage-taken-in-single-turn';
        minDamage: number;
        count: number;
      };
      deathWhenCountReaches?: number;
      regrowth?: {
        trigger: 'end-of-turn';
        requiresLivingPart?: boolean;
        countPerPartLostSinceLastTurn: number;
        suppressedByDamageTypes?: DamageType[];
        healHitPoints?: number;
      };
    }
  | {
      kind: 'extra-reaction';
      appliesTo: 'opportunity-attacks-only';
      count: {
        kind: 'per-part-beyond';
        part: 'head' | 'limb';
        baseline: number;
      };
    };

export type MonsterTraitRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: DamageType; min?: number }
  | { kind: 'hit-points-equals'; value: number };

export type MonsterTraitTrigger =
  | { kind: 'start-of-turn' }
  | { kind: 'end-of-turn' }
  | {
      kind: 'ally-near-target';
      withinFeet: number;
      allyConditionNot?: ConditionId;
    }
  | {
      kind: 'in-environment';
      environment: 'sunlight';
    }
  | {
      kind: 'in-form';
      form: 'object' | 'true-form';
    }
  | {
      kind: 'while-moving-grappled-creature';
    }
  | {
      kind: 'reduced-to-0-hp';
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
  rules?: MonsterTraitRule[];
  modifiesAction?: MonsterTraitActionModifier[];
  checks?: MonsterTraitCheckRule[];
  containment?: MonsterContainmentRule;
  visibility?: MonsterVisibilityRule;
  uses?: {
    count: number;
    period: 'day';
  }
  suppression?: {
    ifTookDamageTypes?: DamageType[];
    duration: 'next-turn';
  }
  notes?: string;
};
