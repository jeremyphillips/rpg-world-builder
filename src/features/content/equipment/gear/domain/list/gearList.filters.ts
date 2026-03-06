import type { AppDataGridFilter } from '@/ui/patterns';
import type { GearListRow } from './gearList.types';
import type { GearSummary } from '@/features/content/shared/domain/types';
import { buildCategoryOptions } from './gearList.options';

/**
 * Returns custom filters for the gear list.
 */
export function buildGearCustomFilters(
  items: GearSummary[],
): AppDataGridFilter<GearListRow>[] {
  const categoryOptions = buildCategoryOptions(items);

  return [
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categoryOptions,
      accessor: (r: GearListRow) => r.category,
    },
  ];
}
