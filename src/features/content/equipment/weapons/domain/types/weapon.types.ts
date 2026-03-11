/**
 * Canonical Weapon content types.
 *
 * Extends the generic ContentItem interfaces with weapon-specific fields.
 * content-system metadata (source, accessPolicy, patched).
 */
import type { EquipmentBase } from '@/features/content/equipment/shared/domain/types/equipment.types';
import type { ContentItem, ContentSummary, ContentInput } from '@/features/content/shared/domain/types/content.types';
import type { Money } from '@/shared/money/types';
import type {
  WeaponCategory,
  WeaponMode,
  WeaponProperty,
  DamageType,
} from '../vocab/weapons.vocab';
import type { DiceOrFlat } from '@/features/mechanics/domain/dice';

export type { WeaponCategory, WeaponMode, WeaponProperty, DamageType };

/** TODO: decide whether to show mastery. Leave for now */
// export type Mastery = 'slow' | 'nick' | 'push' | 'vex' | 'sap' | 'topple' | 'graze';

export interface WeaponFields extends EquipmentBase {
  cost: Money;
  category: WeaponCategory;
  mode: WeaponMode;
  range?: { normal: number; long?: number; unit: 'ft' };
  properties: WeaponProperty[];
  damage: { default: DiceOrFlat; versatile?: DiceOrFlat };
  damageType: DamageType;
  /** TODO: decide whether to show mastery */
  // mastery: string;
}

/** Canonical weapon content item */
export type Weapon = ContentItem & WeaponFields;

/** Minimal list/option model */
export type WeaponSummary = ContentSummary & {
  category: WeaponCategory;
  costCp: number;
  damage: DiceOrFlat; // Flattened to string for List view
  damageType: DamageType;
  properties: WeaponProperty[];
};

/** Create/edit payload */
export type WeaponInput = ContentInput & Partial<WeaponFields>;
