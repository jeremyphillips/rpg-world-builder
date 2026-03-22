import type { Effect, EffectConditionId } from "@/features/mechanics/domain/effects/effects.types";
import type { ContentResolutionMeta } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type { DamageType } from '@/features/mechanics/domain/damage/damage.types';
import type { EffectDuration, EffectUses } from "@/features/mechanics/domain/effects/timing.types";
import type { TurnHookKind } from '@/features/mechanics/domain/triggers/turn-hooks.types';

export type MonsterTraitRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: DamageType; min?: number }
  | { kind: 'hit-points-equals'; value: number };

export type MonsterTraitTrigger =
  | { kind: TurnHookKind }
  | {
      kind: 'ally-near-target';
      withinFeet: number;
      allyConditionNot?: EffectConditionId;
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
  resolution?: ContentResolutionMeta;
};
