import type { DiceOrFlat } from "@/features/mechanics/domain/dice";
import type { AbilityId } from '@/features/mechanics/domain/character';
import type { Effect } from "@/features/mechanics/domain/effects/effects.types";
import type { MonsterSizeCategory } from "@/features/content/monsters/domain/vocab/monster.vocab";
import type { MonsterWeaponAction } from "./monster-equipment.types";
import type { DamageType } from '@/features/mechanics/domain/damage/damage.types';
import type { MonsterAttackType, AttackAbility } from "./monster-combat.types";
import type { EffectUses, RechargeSpec } from "@/features/mechanics/domain/effects/timing.types";
import type { ContentResolutionMeta } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type { AreaOfEffectTemplate } from '@/features/mechanics/domain/effects/area.types';
import type { MonsterSpecialActionTarget } from '@/features/mechanics/domain/effects/targeting.types';

/** One step of Multiattack; `actionId` matches `id` on natural/special actions or `weaponRef` on weapon actions. */
export type MonsterMultiattackSequenceStep = {
  actionId: string;
  count: number;
};

export type MonsterNaturalAttackAction = {
  kind: 'natural';
  /** Stable id for Multiattack / legendary references (kebab-case). */
  id?: string;
  name?: string;
  attackType: MonsterAttackType;
  damageBonus?: number;
  attackBonus?: number;
  damage: DiceOrFlat;
  damageType?: DamageType;
  reach?: number;
  notes?: string;
  attackAbilityOverride?: AttackAbility;
  damageAbilityOverride?: AttackAbility | null;
  onHitEffects?: Effect[];
};

export type MonsterSpecialAction = {
  kind: 'special';
  /** Stable id for Multiattack / legendary references (kebab-case). */
  id?: string;
  name: string;
  description: string;
  attackBonus?: number;
  reach?: number;
  damage?: DiceOrFlat;
  damageBonus?: number;
  damageType?: DamageType;
  save?: {
    ability: AbilityId;
    dc: number;
  };
  area?: AreaOfEffectTemplate;
  target?: MonsterSpecialActionTarget;
  movement?: {
    upToSpeed?: boolean;
    upToSpeedFraction?: 0.5 | 1;
    noOpportunityAttacks?: boolean;
    canEnterCreatureSpaces?: boolean;
    targetSizeMax?: MonsterSizeCategory;
    straightTowardVisibleEnemy?: boolean;
  };
  recharge?: RechargeSpec;
  uses?: EffectUses;
  halfDamageOnSave?: boolean;
  onFail?: Effect[];
  onSuccess?: Effect[];
  effects?: Effect[];
  sequence?: MonsterMultiattackSequenceStep[]
  notes?: string;
  resolution?: ContentResolutionMeta;
};

export type MonsterAction =
  | MonsterWeaponAction
  | MonsterNaturalAttackAction
  | MonsterSpecialAction;
