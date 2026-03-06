/**
 * Shared form types for Weapon Create/Edit routes.
 */
import type {
  WeaponCategory,
  WeaponMode,
  WeaponProperty,
  DamageType,
} from '@/features/content/shared/domain/vocab';
import type { ContentFormValues } from '@/features/content/shared/domain/types';

export type WeaponFormValues = ContentFormValues & {
  category: WeaponCategory | '';
  mode: WeaponMode | '';
  damageType: DamageType;

  // converted from damage: { default, versatile } — stored as strings (RHF-friendly)
  damageDefaultCount: string;
  damageDefaultDie: string;
  damageVersatileCount: string;
  damageVersatileDie: string;
  
  // converted from range: { normal, long }
  rangeNormal: string;
  rangeLong: string;
  properties: WeaponProperty[];
};
