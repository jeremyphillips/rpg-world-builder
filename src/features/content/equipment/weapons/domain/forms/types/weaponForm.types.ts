/**
 * Shared form types for Weapon Create/Edit routes.
 */
import type {
  WeaponCategory,
  WeaponMode,
  WeaponProperty,
  WeaponDamageType,
} from '@/features/content/equipment/weapons/domain/vocab';
import type { ContentFormValues } from '@/features/content/shared/domain/types';

export type WeaponFormValues = ContentFormValues & {
  category: WeaponCategory | '';
  mode: WeaponMode | '';
  damageType: WeaponDamageType;

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
