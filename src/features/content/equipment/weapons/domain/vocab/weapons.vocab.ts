export const WEAPON_CATEGORY_OPTIONS = [
  { value: 'simple', label: 'Simple' },
  { value: 'martial', label: 'Martial' },
] as const;

export type WeaponCategory = (typeof WEAPON_CATEGORY_OPTIONS)[number]['value'];

export const WEAPON_MODE_OPTIONS = [
  { value: 'melee', label: 'Melee' },
  { value: 'ranged', label: 'Ranged' },
] as const;

export type WeaponMode = (typeof WEAPON_MODE_OPTIONS)[number]['value'];

export const WEAPON_PROPERTY_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'finesse', label: 'Finesse' },
  { value: 'thrown', label: 'Thrown' },
  { value: 'two-handed', label: 'Two-Handed' },
  { value: 'versatile', label: 'Versatile' },
  { value: 'reach', label: 'Reach' },
  { value: 'special', label: 'Special' },
  { value: 'ammunition', label: 'Ammunition' },
  { value: 'loading', label: 'Loading' },
  { value: 'heavy', label: 'Heavy' },
] as const;

export type WeaponProperty = (typeof WEAPON_PROPERTY_OPTIONS)[number]['value'];

export const WEAPON_DAMAGE_TYPE_OPTIONS = [
  { value: 'bludgeoning', label: 'Bludgeoning' },
  { value: 'piercing', label: 'Piercing' },
  { value: 'slashing', label: 'Slashing' },
] as const;

export type WeaponDamageType = (typeof WEAPON_DAMAGE_TYPE_OPTIONS)[number]['value'];
