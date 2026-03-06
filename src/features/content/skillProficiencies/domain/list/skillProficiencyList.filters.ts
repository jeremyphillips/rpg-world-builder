import type { AppDataGridFilter } from '@/ui/patterns';
import type { SkillProficiencyListRow } from './skillProficiencyList.types';
import type { SkillProficiencySummary } from '@/features/content/shared/domain/types';
import {
  buildAbilityOptions,
  buildSuggestedClassOptions,
  buildTagOptions,
} from './skillProficiencyList.options';

export function buildSkillProficiencyCustomFilters(
  items: SkillProficiencySummary[],
  classesById: Record<string, { name?: string }> | undefined,
): AppDataGridFilter<SkillProficiencyListRow>[] {
  const abilityOptions = buildAbilityOptions(items);
  const suggestedClassOptions = buildSuggestedClassOptions(items, classesById);
  const tagOptions = buildTagOptions(items);

  return [
    {
      id: 'ability',
      label: 'Ability',
      type: 'select' as const,
      options: abilityOptions,
      accessor: (r) => r.ability ?? '',
    },
    {
      id: 'suggestedClasses',
      label: 'Suggested for Class',
      type: 'multiSelect' as const,
      options: suggestedClassOptions,
      accessor: (r) => r.suggestedClasses ?? [],
    },
    {
      id: 'tags',
      label: 'Tag',
      type: 'multiSelect' as const,
      options: tagOptions,
      accessor: (r) => r.tags ?? [],
    },
  ];
}
