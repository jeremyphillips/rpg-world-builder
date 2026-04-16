import type { AppDataGridColumn } from '@/ui/patterns';
// import { makeBooleanGlyphColumn } from '@/features/content/shared/components';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab/magicSchools.vocab';
import { getSpellResolutionStatus } from '@/features/content/spells/domain/types';
import type { SpellListRow } from './spellList.types';
import {
  formatSpellLevelShortFromUnknown,
  SPELL_UI,
  spellColumnHeaderName,
} from '../spellPresentation';

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
      field: SPELL_UI.school.key,
      headerName: spellColumnHeaderName(SPELL_UI.school),
      width: 120,
      valueFormatter: (v) => (v ? schoolLabel(v as string) : '—'),
    },
    {
      field: SPELL_UI.level.key,
      headerName: spellColumnHeaderName(SPELL_UI.level),
      width: 90,
      type: 'number',
      valueFormatter: (v) => formatSpellLevelShortFromUnknown(v),
    },
    {
      field: SPELL_UI.classes.key,
      headerName: spellColumnHeaderName(SPELL_UI.classes),
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
      field: SPELL_UI.resolutionStatus.key,
      headerName: spellColumnHeaderName(SPELL_UI.resolutionStatus),
      width: 100,
      accessor: (row) => getSpellResolutionStatus(row),
      valueFormatter: (v) => RESOLUTION_STATUS_LABELS[v as string] ?? '—',
      visibility: SPELL_UI.resolutionStatus.ui.visibility,
    },
  ];
}
