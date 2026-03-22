/**
 * Shared form types for Monster Create/Edit routes.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type { MonsterType, MonsterSizeCategory } from '@/features/content/monsters/domain/vocab/monster.vocab';

export type MonsterFormValues = ContentFormValues & {
  type: MonsterType | '';
  sizeCategory: MonsterSizeCategory | '';
  /** Individual JSON fields for mechanics and lore subfields */
  description: string;
  languages: string;
  hitPoints: string;
  armorClass: string;
  movement: string;
  actions: string;
  bonusActions: string;
  legendaryActions: string;
  traits: string;
  abilities: string;
  senses: string;
  proficiencies: string;
  proficiencyBonus: string;
  equipment: string;
  immunities: string;
  vulnerabilities: string;
  alignment: string;
  challengeRating: string;
  xpValue: string;
};
