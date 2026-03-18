import type { AbilityId } from '@/features/mechanics/domain/character';
import type { WeaponDamageType } from "@/features/content/equipment/weapons/domain/vocab";

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

export type DamageType =
  | WeaponDamageType
  | 'fire'
  | 'acid'
  | 'radiant'
  | 'necrotic';

export type TraitRollTarget =
  | 'attack-rolls'
  | 'ability-checks'
  | 'saving-throws';

export type ImmunityType =
  | 'fire'
  | 'acid'
  | 'poison'
  | 'necrotic'
  | 'radiant'
  | 'psychic'
  | 'force'
  | 'charmed'
  | 'exhaustion'
  | 'blinded'
  | 'deafened'
  | 'frightened'
  | 'paralyzed'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export type VulnerabilityType =
  | 'bludgeoning'
  | 'fire';
