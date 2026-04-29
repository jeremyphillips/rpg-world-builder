import type { AppDataGridFilter } from '@/ui/patterns';
import type { SpellListRow } from './spellList.types';
import type { SpellSummary } from '../repo/spellRepo';
import { getSpellResolutionStatus } from '@/features/content/spells/domain/types';
import {
  buildSchoolOptions,
  buildLevelOptions,
  buildClassOptions,
} from './spellList.options';
import {
  SPELL_UI,
  formatSpellLevelName,
  isSpellLevel,
  spellListFilterLabel,
} from '../spellPresentation';

export function buildSpellCustomFilters(
  items: SpellSummary[],
  classesById: Record<string, { name?: string }> | undefined,
): AppDataGridFilter<SpellListRow>[] {
  const schoolOptions = buildSchoolOptions(items);
  const levelOptions = buildLevelOptions(items);
  const classOptions = buildClassOptions(items, classesById);

  return [
    {
      id: SPELL_UI.school.key,
      label: spellListFilterLabel(SPELL_UI.school),
      type: 'multiSelect' as const,
      options: schoolOptions,
      accessor: (r) => (r.school ? [r.school] : []),
    },
    {
      id: SPELL_UI.level.key,
      label: spellListFilterLabel(SPELL_UI.level),
      type: 'select' as const,
      options: levelOptions,
      accessor: (r) => String(r.level),
      formatActiveBadgeValue: ({ value }) => {
        const v = String(value ?? '');
        if (v === '') return '';
        const n = Number(v);
        if (!isSpellLevel(n)) return v;
        return formatSpellLevelName(n);
      },
    },
    {
      id: SPELL_UI.classes.key,
      label: spellListFilterLabel(SPELL_UI.classes),
      type: 'multiSelect' as const,
      options: classOptions,
      accessor: (r) => r.classes ?? [],
    },
    {
      id: SPELL_UI.resolutionStatus.key,
      label: spellListFilterLabel(SPELL_UI.resolutionStatus),
      type: 'select' as const,
      options: [
        { label: 'All', value: '' },
        { label: 'Stub', value: 'stub' },
        { label: 'Partial', value: 'partial' },
        { label: 'Full', value: 'full' },
      ],
      accessor: (r) => getSpellResolutionStatus(r),
      visibility: SPELL_UI.resolutionStatus.ui.visibility,
    },
  ];
}
