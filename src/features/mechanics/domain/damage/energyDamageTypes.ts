import { ELEMENTAL_DAMAGE_TYPES } from './elementalDamageTypes'
import { PLANAR_DAMAGE_TYPES } from './planarDamageTypes'

export const ENERGY_DAMAGE_TYPES = [...ELEMENTAL_DAMAGE_TYPES, ...PLANAR_DAMAGE_TYPES] as const

export type EnergyDamageType = (typeof ENERGY_DAMAGE_TYPES)[number]['id']

export const ENERGY_DAMAGE_TYPE_IDS = ENERGY_DAMAGE_TYPES.map((r) => r.id)
