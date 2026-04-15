import type { AppDataGridFilter } from '@/ui/patterns';
import type { SpellListRow } from './spellList.types';
import type { SpellSummary } from '../repo/spellRepo';
import { getSpellResolutionStatus } from '@/features/content/spells/domain/types';
import {
  buildSchoolOptions,
  buildLevelOptions,
  buildClassOptions,
} from './spellList.options';
import { SPELL_CORE_UI } from '../spellPresentation';

export function buildSpellCustomFilters(
  items: SpellSummary[],
  classesById: Record<string, { name?: string }> | undefined,
): AppDataGridFilter<SpellListRow>[] {
  const schoolOptions = buildSchoolOptions(items);
  const levelOptions = buildLevelOptions(items);
  const classOptions = buildClassOptions(items, classesById);

  return [
    {
      id: SPELL_CORE_UI.school.key,
      label: SPELL_CORE_UI.school.label,
      type: 'multiSelect' as const,
      options: schoolOptions,
      accessor: (r) => r.school ? [r.school] : [],
    },
    {
      id: SPELL_CORE_UI.level.key,
      label: SPELL_CORE_UI.level.label,
      type: 'select' as const,
      options: levelOptions,
      accessor: (r) => String(r.level),
    },
    {
      id: SPELL_CORE_UI.classes.key,
      label: SPELL_CORE_UI.classes.listFilterLabel,
      type: 'multiSelect' as const,
      options: classOptions,
      accessor: (r) => r.classes ?? [],
    },
    {
      id: 'resolutionStatus',
      label: 'Status',
      type: 'select' as const,
      options: [
        { label: 'All', value: '' },
        { label: 'Stub', value: 'stub' },
        { label: 'Partial', value: 'partial' },
        { label: 'Full', value: 'full' },
      ],
      accessor: (r) => getSpellResolutionStatus(r),
      visibility: { platformAdminOnly: true },
    },
  ];
}
