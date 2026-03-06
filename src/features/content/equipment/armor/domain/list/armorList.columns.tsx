import { makeBooleanGlyphColumn } from '@/features/content/shared/components';
import { formatCp } from '@/shared/money';
import type { ArmorListRow } from './armorList.types';

const EMPTY_PLACEHOLDER = '—';

/**
 * Returns custom columns for the armor list.
 */
export function buildArmorCustomColumns() {
  return [
    {
      field: 'baseAC',
      headerName: 'AC',
      width: 80,
      type: 'number' as const,
      valueFormatter: (v: unknown) =>
        v != null ? String(v) : EMPTY_PLACEHOLDER,
    },
    {
      field: 'acBonus',
      headerName: 'AC Bonus',
      width: 100,
      type: 'number' as const,
      valueFormatter: (v: unknown) =>
        v != null ? `+${v}` : EMPTY_PLACEHOLDER,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 110,
    },
    makeBooleanGlyphColumn<ArmorListRow>(
      'stealthDisadvantage',
      'Stealth Disadv.',
      (row) => Boolean(row.stealthDisadvantage),
    ),
    {
      field: 'costCp',
      headerName: 'Cost',
      width: 110,
      type: 'number' as const,
      valueFormatter: (v: unknown) => formatCp(v as number),
    },
  ];
}
