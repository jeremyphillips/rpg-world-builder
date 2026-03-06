import type { GearSummary } from '@/features/content/shared/domain/types';

export type FilterOption = { label: string; value: string };

/** Build category options from current items. */
export function buildCategoryOptions(items: GearSummary[]): FilterOption[] {
  const cats = [...new Set(items.map((i) => i.category))].sort();
  return [{ label: 'All', value: '' }, ...cats.map((c) => ({ label: c, value: c }))];
}
