import type { Effect } from "@/features/mechanics/domain/effects/effects.types";
import type { ConditionId, DamageType } from "./monster-combat.types";
import type { EffectDuration, EffectUses } from "@/features/mechanics/domain/effects/timing.types";

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
  effects?: Effect[];
  uses?: EffectUses
  suppression?: {
    ifTookDamageTypes?: DamageType[];
    duration: EffectDuration;
  }
  notes?: string;
};
