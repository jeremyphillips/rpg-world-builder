import type { AppDataGridFilter } from '@/ui/patterns';
import type { WeaponListRow } from './weaponList.types';
import type { WeaponSummary } from '@/features/content/shared/domain/types';
import { buildCategoryOptions, buildPropertyOptions } from './weaponList.options';

/**
 * Returns custom filters for the weapon list.
 */
export function buildWeaponCustomFilters(
  items: WeaponSummary[],
): AppDataGridFilter<WeaponListRow>[] {
  const categoryOptions = buildCategoryOptions(items);
  const propertyOptions = buildPropertyOptions(items);

  return [
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categoryOptions,
      accessor: (r: WeaponListRow) => r.category,
    },
    {
      id: 'property',
      label: 'Property',
      type: 'multiSelect' as const,
      options: propertyOptions,
      accessor: (r: WeaponListRow) => r.properties ?? [],
    },
  ];
}
