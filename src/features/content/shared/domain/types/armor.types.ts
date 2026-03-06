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
import type { Material, ArmorCategory, DexContributionMode } from '../vocab/armor.vocab';

export type DexContribution =
  | { mode: Extract<DexContributionMode, 'full'> }
  | { mode: Extract<DexContributionMode, 'capped'>; maxBonus: number }
  | { mode: Extract<DexContributionMode, 'none'> };

export type { Material, ArmorCategory };

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

