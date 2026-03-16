import type { Effect } from "@/features/mechanics/domain/effects/effects.types";
import type { ConditionId, DamageType } from "./monster-combat.types";
import type { EffectDuration, EffectUses } from "@/features/mechanics/domain/effects/timing.types";

export type MonsterTraitRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: DamageType; min?: number }
  | { kind: 'hit-points-equals'; value: number };

export type MonsterTraitTrigger =
  | { kind: 'turn-start' }
  | { kind: 'turn-end' }
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
  effects?: Effect[];
  uses?: EffectUses
  suppression?: {
    ifTookDamageTypes?: DamageType[];
    duration: EffectDuration;
  }
  notes?: string;
};
