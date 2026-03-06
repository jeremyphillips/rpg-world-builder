import type { WeaponSummary } from '@/features/content/shared/domain/types';

export type FilterOption = { label: string; value: string };

/** Build category options from current items. */
export function buildCategoryOptions(items: WeaponSummary[]): FilterOption[] {
  const cats = [...new Set(items.map((i) => i.category))].sort();
  return [{ label: 'All', value: '' }, ...cats.map((c) => ({ label: c, value: c }))];
}

/** Build property options from current items. */
export function buildPropertyOptions(items: WeaponSummary[]): FilterOption[] {
  const props = [...new Set(items.flatMap((i) => i.properties ?? []))].sort();
  return props.map((p) => ({ label: p, value: p }));
}
