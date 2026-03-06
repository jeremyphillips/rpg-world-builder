import type { AppDataGridFilter } from '@/ui/patterns';
import type { ArmorListRow } from './armorList.types';
import type { ArmorSummary } from '@/features/content/shared/domain/types';
import { buildCategoryOptions } from './armorList.options';

/**
 * Returns custom filters for the armor list.
 */
export function buildArmorCustomFilters(
  items: ArmorSummary[],
): AppDataGridFilter<ArmorListRow>[] {
  const categoryOptions = buildCategoryOptions(items);

  return [
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categoryOptions,
      accessor: (r: ArmorListRow) => r.category,
    },
    {
      id: 'stealth',
      label: 'Stealth Disadvantage',
      type: 'boolean' as const,
      accessor: (r: ArmorListRow) => r.stealthDisadvantage,
    },
  ];
}
