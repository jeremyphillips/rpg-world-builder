/**
 * Classic elements and biological/concussive counterparts (acid, poison).
 * Same authoring pattern as {@link ABILITIES} — rows, then derived types.
 */
export const ELEMENTAL_DAMAGE_TYPES = [
  { id: 'fire', name: 'Fire' },
  { id: 'cold', name: 'Cold' },
  { id: 'acid', name: 'Acid' },
  { id: 'lightning', name: 'Lightning' },
  { id: 'thunder', name: 'Thunder' },
  { id: 'poison', name: 'Poison' },
] as const

export type ElementalDamageType = (typeof ELEMENTAL_DAMAGE_TYPES)[number]['id']

export const ELEMENTAL_DAMAGE_TYPE_IDS = ELEMENTAL_DAMAGE_TYPES.map((r) => r.id)
