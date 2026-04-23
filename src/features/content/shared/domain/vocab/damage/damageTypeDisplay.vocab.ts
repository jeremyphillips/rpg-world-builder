import { ENERGY_DAMAGE_TYPES } from './energyDamageTypes.vocab';
import { PHYSICAL_DAMAGE_TYPE_OPTIONS } from './physicalDamageTypes.vocab';

/**
 * All creature-facing damage type rows: physical, then elemental, then planar.
 * Used for labels, tooltips, and merged select options.
 */
export const DAMAGE_TYPE_ROWS = [...PHYSICAL_DAMAGE_TYPE_OPTIONS, ...ENERGY_DAMAGE_TYPES] as const;

export type DamageTypeRowId = (typeof DAMAGE_TYPE_ROWS)[number]['id'];

const DAMAGE_TYPE_DISPLAY_NAME_BY_ID: ReadonlyMap<string, string> = new Map(
  DAMAGE_TYPE_ROWS.map((r) => [r.id, r.name] as const),
);

/** User-facing label from {@link DAMAGE_TYPE_ROWS}; `undefined` if `id` is unknown. */
export function getDamageTypeDisplayName(id: string): string | undefined {
  return DAMAGE_TYPE_DISPLAY_NAME_BY_ID.get(id);
}

/** Merged physical + energy — for AppFormSelect / MUI: `value` + `label`. */
export const DAMAGE_TYPE_FULL_SELECT_OPTIONS: { value: string; label: string }[] = DAMAGE_TYPE_ROWS.map(
  (r) => ({
    value: r.id,
    label: r.name,
  }),
);
