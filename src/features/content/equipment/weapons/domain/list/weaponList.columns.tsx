import { formatCp } from '@/shared/money';

const EMPTY_PLACEHOLDER = '—';

/**
 * Returns custom columns for the weapon list.
 */
export function buildWeaponCustomColumns() {
  return [
    {
      field: 'category',
      headerName: 'Category',
      width: 110,
    },
    {
      field: 'damage',
      headerName: 'Damage',
      width: 80,
      valueFormatter: (v: unknown) =>
        v != null ? String(v) : EMPTY_PLACEHOLDER,
    },
    {
      field: 'damageType',
      headerName: 'Damage Type',
      width: 120,
      valueFormatter: (v: unknown) =>
        v != null ? String(v) : EMPTY_PLACEHOLDER,
    },
    {
      field: 'properties',
      headerName: 'Properties',
      width: 180,
      valueFormatter: (v: unknown) =>
        Array.isArray(v) ? (v as string[]).join(', ') : EMPTY_PLACEHOLDER,
    },
    {
      field: 'costCp',
      headerName: 'Cost',
      width: 110,
      type: 'number' as const,
      valueFormatter: (v: unknown) => formatCp(v as number),
    },
  ];
}
