import type { ClassSummary } from '../repo/classRepo';
import { ABILITIES } from '@/features/mechanics/domain/character';

export type FilterOption = { label: string; value: string };

/** Build hit die options from current items. */
export function buildHitDieOptions(items: ClassSummary[]): FilterOption[] {
  const dice = [...new Set(items.map((i) => i.progression?.hitDie).filter(Boolean))].sort(
    (a, b) => (a ?? 0) - (b ?? 0),
  );
  return [
    { label: 'All', value: '' },
    ...dice.map((d) => ({ label: `d${d}`, value: String(d) })),
  ];
}

/** Static spellcasting filter options. */
export const SPELLCASTING_FILTER_OPTIONS: FilterOption[] = [
  { label: 'All', value: '' },
  { label: 'Full', value: 'full' },
  { label: 'Half', value: 'half' },
  { label: 'Pact', value: 'pact' },
  { label: 'None', value: 'none' },
];

/** Primary ability options for multiSelect filter. */
export const PRIMARY_ABILITY_OPTIONS = ABILITIES.map((a) => ({
  value: a.id,
  label: a.id.toUpperCase(),
}));
