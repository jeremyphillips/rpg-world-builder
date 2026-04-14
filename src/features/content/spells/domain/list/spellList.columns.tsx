import type { AppDataGridColumn } from '@/ui/patterns';
// import { makeBooleanGlyphColumn } from '@/features/content/shared/components';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab/magicSchools.vocab';
import { getSpellResolutionStatus } from '@/features/content/spells/domain/types';
import type { SpellListRow } from './spellList.types';
import { formatSpellLevelShortFromUnknown } from '@/features/content/spells/domain/spellPresentation';

const schoolLabel = (value: string) =>
  MAGIC_SCHOOL_OPTIONS.find((o) => o.id === value)?.name ?? value;

const RESOLUTION_STATUS_LABELS: Record<string, string> = {
  stub: 'Stub',
  partial: 'Partial',
  full: 'Full',
};

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
      valueFormatter: (v) => formatSpellLevelShortFromUnknown(v),
    },
    {
      field: 'classes',
      headerName: 'Classes',
      flex: 1,
      minWidth: 180,
      accessor: (row) => {
        const byId = classesById ?? {};
        const allowed = (row.classes ?? []).filter((id) => id in byId);
        if (!allowed.length) return EMPTY_PLACEHOLDER;
        return allowed.map((id) => byId[id]?.name ?? id).join(', ');
      },
      valueFormatter: (v) => (v != null && v !== '' ? String(v) : EMPTY_PLACEHOLDER),
    },
    {
      field: 'resolutionStatus',
      headerName: 'Status',
      width: 100,
      accessor: (row) => getSpellResolutionStatus(row),
      valueFormatter: (v) => RESOLUTION_STATUS_LABELS[v as string] ?? '—',
    },
  ];
}
