/**
 * Canonical Weapon content types.
 *
 * Extends the generic ContentItem interfaces with weapon-specific fields.
 * content-system metadata (source, accessPolicy, patched).
 */
import type { EquipmentBase } from './equipment.types';
import type { ContentItem, ContentSummary, ContentInput } from './content.types';
import type { Money } from '@/shared/money/types';

export type WeaponCategory = 'simple' | 'martial';

export type WeaponMode = 'melee' | 'ranged';

export type WeaponProperty =
  | 'light'
  | 'finesse'
  | 'thrown'
  | 'two-handed'
  | 'versatile'
  | 'reach'
  | 'special'
  | 'ammunition'
  | 'loading'
  | 'heavy';

export interface WeaponFields extends EquipmentBase {
  cost: Money;
  category: WeaponCategory;
  mode: WeaponMode;
  range?: { normal: number; long?: number; unit: 'ft' };
  properties: WeaponProperty[];
  damage: { default: string; versatile?: string };
  damageType: string;
  mastery: string;
}

/** Canonical weapon content item */
export type Weapon = ContentItem & WeaponFields;

/** Minimal list/option model */
export type WeaponSummary = ContentSummary & {
  category: WeaponCategory;
  costCp: number;
  damage: string;
  damageType: string;
  properties: WeaponProperty[];
};

/** Create/edit payload */
export type WeaponInput = ContentInput & Partial<WeaponFields>;