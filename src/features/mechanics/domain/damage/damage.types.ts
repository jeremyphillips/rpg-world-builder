import type { WeaponDamageType } from '@/features/content/equipment/weapons/domain/vocab'
import type { EnergyDamageType } from './energyDamageTypes'

export type { ElementalDamageType } from './elementalDamageTypes'
export type { PlanarDamageType } from './planarDamageTypes'
export type { EnergyDamageType } from './energyDamageTypes'

/**
 * Canonical damage types for mechanics: weapon types (including `none`) plus energy types.
 * Used by monsters, traits, spells, and encounter resolution.
 */
export type DamageType = WeaponDamageType | EnergyDamageType

/** Any damage that can apply to a creature (weapon forms never use `none` on creatures). */
export type CreatureDamageImmunityType = Exclude<DamageType, 'none'>
