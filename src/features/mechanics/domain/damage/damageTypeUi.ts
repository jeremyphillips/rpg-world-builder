import { WEAPON_DAMAGE_TYPE_OPTIONS } from '@/features/content/equipment/weapons/domain/vocab/weapons.vocab'
import { ENERGY_DAMAGE_TYPES } from './energyDamageTypes'

/**
 * Physical weapon damage rows (no `none`) merged with energy rows — single list for selects and labels.
 * Order: bludgeoning, piercing, slashing, then elemental, then planar (see elemental/planar modules).
 */
export const DAMAGE_TYPE_ROWS = [
  ...WEAPON_DAMAGE_TYPE_OPTIONS.filter((o) => o.value !== 'none').map((o) => ({
    id: o.value,
    name: o.label,
  })),
  ...ENERGY_DAMAGE_TYPES,
] as const

export type DamageTypeRowId = (typeof DAMAGE_TYPE_ROWS)[number]['id']

/** For FormSelectField / MUI: `value` + `label`. */
export const DAMAGE_TYPE_SELECT_OPTIONS: { value: string; label: string }[] = DAMAGE_TYPE_ROWS.map((r) => ({
  value: r.id,
  label: r.name,
}))

/**
 * Resistance cantrip — SRD order; subset of {@link DAMAGE_TYPE_ROWS} (excludes force, psychic).
 */
const RESISTANCE_SPELL_DAMAGE_TYPE_IDS = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'radiant',
  'slashing',
  'thunder',
] as const

export const RESISTANCE_SPELL_DAMAGE_TYPE_OPTIONS: { value: string; label: string }[] =
  RESISTANCE_SPELL_DAMAGE_TYPE_IDS.map((id) => {
    const row = DAMAGE_TYPE_ROWS.find((r) => r.id === id)
    if (!row) {
      throw new Error(`RESISTANCE_SPELL_DAMAGE_TYPE_IDS: missing DAMAGE_TYPE_ROWS entry for "${id}"`)
    }
    return { value: row.id, label: row.name }
  })
