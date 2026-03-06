import { makeBooleanGlyphColumn } from '@/features/content/shared/components';
import { formatCp } from '@/shared/money';
import type { MagicItemListRow } from './magicItemList.types';

const EMPTY_PLACEHOLDER = '—';

/**
 * Returns custom columns for the magic item list.
 */
export function buildMagicItemCustomColumns() {
  return [
    {
      field: 'slot',
      headerName: 'Slot',
      width: 110,
    },
    {
      field: 'rarity',
      headerName: 'Rarity',
      width: 120,
      valueFormatter: (v: unknown) =>
        v != null ? String(v) : EMPTY_PLACEHOLDER,
    },
    makeBooleanGlyphColumn<MagicItemListRow>(
      'requiresAttunement',
      'Attunement',
      (row) => Boolean(row.requiresAttunement),
      { tone: 'default' },
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
