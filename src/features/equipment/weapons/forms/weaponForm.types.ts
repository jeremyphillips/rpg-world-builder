/**
 * Shared form types for Weapon Create/Edit routes.
 */
import type {
  WeaponCategory,
  WeaponMode,
  WeaponProperty,
  DamageType,
} from '@/features/content/domain/vocab';
import type { ContentFormValues } from '@/features/content/domain/types';

export type WeaponFormValues = ContentFormValues & {
  category: WeaponCategory | '';
  mode: WeaponMode | '';
  // converted from damage: { default, versatile }
  damageDefault: string;
  damageVersatile: string;
  damageType: DamageType;
  // converted from range: { normal, long }
  rangeNormal: string;
  rangeLong: string;
  properties: WeaponProperty[];
  // mastery: string;
};
