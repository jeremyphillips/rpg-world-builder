import type { AbilityId } from "@/features/mechanics/domain/core/character/abilities.types";
import type { MonsterSizeCategory } from "@/features/content/monsters/domain/vocab/monster.vocab";
import type { ConditionId, DamageType, TraitRollTarget } from "./monster-combat.types";
import type {
  ActionEffect,
  ConditionEffect,
  DamageEffect,
  DeathOutcomeEffect,
  ExtraReactionEffect,
  FormEffect,
  HitPointsEffect,
  HoldBreathEffect,
  ImmunityEffect,
  IntervalEffect,
  MoveEffect,
  NoteEffect,
  RollModifierEffect,
  SaveDcSpec,
  SaveEffect,
  SpawnEffect,
  StateEffect,
  TrackedPartEffect,
  TargetingEffect,
} from "@/features/mechanics/domain/effects/effects.types";

export type MonsterConditionEffect = Omit<ConditionEffect, 'conditionId' | 'targetSizeMax'> & {
  conditionId: ConditionId;
  targetSizeMax?: MonsterSizeCategory;
};

export type MonsterRollModifierEffect = Omit<RollModifierEffect, 'appliesTo'> & {
  appliesTo: TraitRollTarget | TraitRollTarget[];
};

export type MonsterDamageEffect = DamageEffect & {
  damageType?: DamageType;
};

export type MonsterStateEffect = Omit<StateEffect, 'stateId' | 'targetSizeMax' | 'ongoingEffects'> & {
  stateId: string;
  targetSizeMax?: MonsterSizeCategory;
  ongoingEffects?: MonsterEffect[];
};

export type MonsterMoveEffect = MoveEffect;
export type MonsterFormEffect = Omit<FormEffect, 'allowedSizes'> & {
  allowedSizes?: MonsterSizeCategory[];
};
export type MonsterActionEffect = ActionEffect;
export type MonsterSpawnEffect = SpawnEffect;
export type MonsterNoteEffect = NoteEffect;
export type MonsterHitPointsEffect = HitPointsEffect;
export type MonsterTargetingEffect = TargetingEffect;
export type MonsterIntervalEffect = IntervalEffect;
export type MonsterImmunityEffect = ImmunityEffect;
export type MonsterDeathOutcomeEffect = DeathOutcomeEffect;
export type MonsterHoldBreathEffect = HoldBreathEffect;
export type MonsterTrackedPartEffect = Omit<TrackedPartEffect, 'regrowth'> & {
  regrowth?: Omit<NonNullable<TrackedPartEffect['regrowth']>, 'suppressedByDamageTypes'> & {
    suppressedByDamageTypes?: DamageType[];
  };
};
export type MonsterExtraReactionEffect = ExtraReactionEffect;

export type MonsterEffect =
  | MonsterConditionEffect
  | MonsterRollModifierEffect
  | MonsterDamageEffect
  | MonsterStateEffect
  | MonsterTargetingEffect
  | MonsterIntervalEffect
  | MonsterImmunityEffect
  | MonsterDeathOutcomeEffect
  | MonsterHoldBreathEffect
  | MonsterTrackedPartEffect
  | MonsterExtraReactionEffect
  | MonsterMoveEffect
  | MonsterFormEffect
  | MonsterNoteEffect
  | MonsterActionEffect
  | { kind: 'limb'; mode: 'sever' | 'grow'; count: number }
  | MonsterSpawnEffect
  | { kind: 'resource'; resource: 'exhaustion'; mode: 'set' | 'add'; value: 'per-missing-limb' }
  | MonsterHitPointsEffect;

export type MonsterAppliedEffect =
  | MonsterConditionEffect
  | MonsterStateEffect
  | MonsterNoteEffect;

export type MonsterOnHitEffect =
  | MonsterConditionEffect
  | MonsterStateEffect
  | MonsterIntervalEffect
  | MonsterDeathOutcomeEffect
  | (Omit<SaveEffect, 'onFail' | 'onSuccess'> & {
      onFail: MonsterAppliedEffect[];
      onSuccess?: MonsterAppliedEffect[];
    })
  | MonsterDamageEffect;

export type MonsterActionTrigger = {
  when: 'after_damage';
  targetState?: 'bloodied';
};

export type MonsterTriggeredSave = {
  ability: AbilityId;
  dc: SaveDcSpec;
  except?: {
    damageTypes?: DamageType[];
    criticalHit?: boolean;
  };
  onSuccess?: MonsterEffect[];
  onFail?: MonsterEffect[];
};
