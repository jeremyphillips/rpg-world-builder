import type { AbilityId } from '@/features/mechanics/domain/character';

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
  | 'incoming-attacks'
  | 'ability-checks'
  | 'saving-throws';
