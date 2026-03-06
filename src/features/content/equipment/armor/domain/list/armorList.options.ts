import type { ArmorSummary } from '@/features/content/shared/domain/types';

export type FilterOption = { label: string; value: string };

/** Build category options from current items. */
export function buildCategoryOptions(items: ArmorSummary[]): FilterOption[] {
  const cats = [...new Set(items.map((i) => i.category))].sort();
  return [{ label: 'All', value: '' }, ...cats.map((c) => ({ label: c, value: c }))];
}
