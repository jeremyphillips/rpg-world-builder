import type { AbilityId } from '@/features/mechanics/domain/character';
import type { CreatureDamageImmunityType } from '@/features/mechanics/domain/damage/damage.types';

export type { DamageType, CreatureDamageImmunityType } from '@/features/mechanics/domain/damage/damage.types';

export type AttackAbility = AbilityId;

export type MonsterAttackType =
  | 'claw'
  | 'bite'
  | 'beak'
  | 'tail'
  | 'wing'
  | 'horn'
  | 'hoof'
  | 'fang'
  | 'talon'
  | 'pseudopod'
  | 'slam'
  | 'constrict'
  | 'touch';

export type TraitRollTarget =
  | 'attack-rolls'
  | 'ability-checks'
  | 'saving-throws';

export type ImmunityType =
  | CreatureDamageImmunityType
  | 'charmed'
  | 'exhaustion'
  | 'blinded'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export type VulnerabilityType = CreatureDamageImmunityType;

/** Damage types used for `mechanics.resistances` (half damage). */
export type MonsterResistanceType = CreatureDamageImmunityType;
