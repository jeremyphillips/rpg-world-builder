import type { PickerOption } from '@/ui/patterns';
import { DAMAGE_TYPE_ROWS } from './damage/damageTypeDisplay.vocab';
import { EFFECT_CONDITION_DEFINITIONS } from './effectConditions.vocab';

const EXHAUSTION_PICKER_OPTION: PickerOption = {
  value: 'exhaustion',
  label: 'Exhaustion',
  description:
    'When a stat block lists immunity to exhaustion, the creature does not use or gain exhaustion levels (common for undead, constructs, and some celestials).',
};

const damageTypePickerOptions: PickerOption[] = DAMAGE_TYPE_ROWS.map((r) => ({
  value: r.id,
  label: r.name,
  description: r.description,
}));

const effectConditionPickerOptions: PickerOption[] = EFFECT_CONDITION_DEFINITIONS.map((c) => ({
  value: c.id,
  label: c.name,
  description: c.rulesText,
}));

/**
 * All damage + condition (and exhaustion) ids for creature immunity multiselect (stat block / MM style).
 * Order: damage (physical, then elemental, then planar), standard conditions, exhaustion.
 */
export const CREATURE_IMMUNITY_PICKER_OPTIONS: PickerOption[] = [
  ...damageTypePickerOptions,
  ...effectConditionPickerOptions,
  EXHAUSTION_PICKER_OPTION,
];

const IMMUNITY_ID_SET: ReadonlySet<string> = new Set(
  CREATURE_IMMUNITY_PICKER_OPTIONS.map((o) => o.value),
);

/** Damage types only; for creature vulnerability multiselect. */
export const CREATURE_VULNERABILITY_PICKER_OPTIONS: PickerOption[] = damageTypePickerOptions;

const VULNERABILITY_ID_SET: ReadonlySet<string> = new Set(
  CREATURE_VULNERABILITY_PICKER_OPTIONS.map((o) => o.value),
);

export function filterToAllowedCreatureImmunityIds(ids: string[]): string[] {
  return ids.filter((id) => IMMUNITY_ID_SET.has(id));
}

export function filterToAllowedVulnerabilityIds(ids: string[]): string[] {
  return ids.filter((id) => VULNERABILITY_ID_SET.has(id));
}
