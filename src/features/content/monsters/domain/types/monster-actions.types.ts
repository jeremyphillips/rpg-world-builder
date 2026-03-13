import type { DiceOrFlat } from "@/features/mechanics/domain/dice";
import type { AbilityId } from "@/features/mechanics/domain/core/character/abilities.types";
import type { MonsterSizeCategory } from "@/features/content/monsters/domain/vocab/monster.vocab";
import type { MonsterWeaponAction } from "./monster-equipment.types";
import type { MonsterAttackType, AttackAbility, DamageType } from "./monster-combat.types";
import type { MonsterOnHitEffect, MonsterEffect, MonsterActionTrigger } from "./monster-effects.types";
import type { EffectUses, RechargeSpec } from "@/features/mechanics/domain/effects/timing.types";

export type MonsterNaturalAttackAction = {
  kind: 'natural';
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
  onHitEffects?: MonsterOnHitEffect[];
};

export type MonsterSpecialAction = {
  kind: 'special';
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
  area?: {
    kind: "cone" | "sphere" | "line" | "square" | "cylinder" | "cube";
    size: number
  }
  target?: "creatures-in-area" | 'creatures-entered-during-move'
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
  trigger?: MonsterActionTrigger;
  halfDamageOnSave?: boolean;
  onFail?: MonsterEffect[];
  onSuccess?: MonsterEffect[];
  effects?: MonsterEffect[];
  sequence?: {
    actionName: string,
    count: number
  }[]
  notes?: string;
};

export type MonsterAction =
  | MonsterWeaponAction
  | MonsterNaturalAttackAction
  | MonsterSpecialAction;
