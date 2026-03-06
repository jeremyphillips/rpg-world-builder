/**
 * Shared form types for Armor Create/Edit routes.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type { ArmorCategory, Material } from '@/features/content/shared/domain/vocab';

export type ArmorFormValues = ContentFormValues & {
  category: ArmorCategory | '';
  material: Material | '';
  baseAC: string;
  acBonus: string;
  stealthDisadvantage: boolean;
};
