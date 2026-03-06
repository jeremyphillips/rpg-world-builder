import type { AppDataGridColumn } from '@/ui/patterns';
import { makeBooleanGlyphColumn } from '@/features/content/shared/components';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab/magicSchools.vocab';
import { filterAllowedIds } from '@/features/content/shared/domain/utils';
import type { SpellListRow } from './spellList.types';

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.value === value)?.label ?? value;

const EMPTY_PLACEHOLDER = '—';

export function buildSpellCustomColumns(
  classesById: Record<string, { name?: string }> | undefined,
): AppDataGridColumn<SpellListRow>[] {
  return [
    {
      field: 'school',
      headerName: 'School',
      width: 120,
      valueFormatter: (v) => (v ? schoolLabel(v as string) : '—'),
    },
    {
      field: 'level',
      headerName: 'Level',
      width: 90,
      type: 'number',
      valueFormatter: (v) =>
        v === 0 ? 'Cantrip' : v != null ? String(v) : '—',
    },
    {
      field: 'classes',
      headerName: 'Classes',
      flex: 1,
      minWidth: 180,
      accessor: (row) => {
        const allowed = filterAllowedIds(row.classes, classesById ?? {});
        if (!allowed?.length) return EMPTY_PLACEHOLDER;
        return allowed
          .map((id) => classesById?.[id]?.name ?? id)
          .join(', ');
      },
      valueFormatter: (v) => (v != null && v !== '' ? String(v) : EMPTY_PLACEHOLDER),
    },
    makeBooleanGlyphColumn<SpellListRow>(
      'ritual',
      'Ritual',
      (row) => Boolean(row.ritual),
    ),
    makeBooleanGlyphColumn<SpellListRow>(
      'concentration',
      'Concentration',
      (row) => Boolean(row.concentration),
    ),
  ];
}
