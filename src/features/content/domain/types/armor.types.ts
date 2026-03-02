/**
 * Canonical Armor content types.
 *
 * Extends the generic ContentItem interfaces with armor-specific fields.
 * The data shape mirrors ArmorItem from src/data/equipment but adds
 * content-system metadata (source, accessPolicy, patched).
 */
import type { Money } from '@/shared/money/types';
import type {
  ContentItem,
  ContentSummary,
  ContentInput,
} from './content.types';
import type { EquipmentBase } from './equipment.types';

type DexContribution =
  | { mode: 'full' }
  | { mode: 'capped'; maxBonus: number }  // e.g. 2
  | { mode: 'none' };

export type Material = 'metal' | 'organic' | 'fabric' | 'wood' | 'stone'

export type ArmorCategory =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'shields';

export interface ArmorFields extends EquipmentBase {
  cost: Money;
  category: ArmorCategory;
  material: Material;
  baseAC?: number;
  dex?: DexContribution;
  stealthDisadvantage?: boolean;
  minStrength?: number;
  acBonus?: number;
}

export type ArmorSummary = ContentSummary & {
  category: ArmorCategory;
  costCp: number;
  baseAC?: number;
  acBonus?: number;
  stealthDisadvantage: boolean;
};

export type ArmorInput = ContentInput & Partial<ArmorFields>;

export type Armor = ContentItem & ArmorFields;

