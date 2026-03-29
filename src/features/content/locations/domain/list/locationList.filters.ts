import type { AppDataGridFilter } from '@/ui/patterns';
import type { LocationSummary } from '../types';
import { LOCATION_SCALE_FILTER_OPTIONS, LOCATION_SOURCE_FILTER_OPTIONS } from './locationList.options';
import type { LocationListRow } from './locationList.types';

function distinctCategories(items: LocationSummary[]): { value: string; label: string }[] {
  const set = new Set<string>();
  for (const it of items) {
    if (it.category?.trim()) set.add(it.category.trim());
  }
  return [...set].sort().map((c) => ({ value: c, label: c }));
}

export function buildLocationListFilters(
  items: LocationSummary[],
): AppDataGridFilter<LocationListRow>[] {
  const categoryOptions = distinctCategories(items);

  return [
    {
      id: 'scale',
      label: 'Scale',
      type: 'select' as const,
      options: LOCATION_SCALE_FILTER_OPTIONS,
      accessor: (r) => r.scale,
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select' as const,
      options: categoryOptions,
      accessor: (r) => r.category ?? '',
    },
    {
      id: 'source',
      label: 'Source',
      type: 'select' as const,
      options: [...LOCATION_SOURCE_FILTER_OPTIONS],
      accessor: (r) => r.source,
    },
  ];
}
