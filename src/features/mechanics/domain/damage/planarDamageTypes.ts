/**
 * Outer-planar or pure magical essence damage.
 */
export const PLANAR_DAMAGE_TYPES = [
  { id: 'radiant', name: 'Radiant' },
  { id: 'necrotic', name: 'Necrotic' },
  { id: 'force', name: 'Force' },
  { id: 'psychic', name: 'Psychic' },
] as const

export type PlanarDamageType = (typeof PLANAR_DAMAGE_TYPES)[number]['id']

export const PLANAR_DAMAGE_TYPE_IDS = PLANAR_DAMAGE_TYPES.map((r) => r.id)
