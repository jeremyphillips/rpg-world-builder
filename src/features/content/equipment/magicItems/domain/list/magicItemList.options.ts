import type { MagicItemSummary } from '@/features/content/shared/domain/types';

export type FilterOption = { label: string; value: string };

/** Build slot options from current items. */
export function buildSlotOptions(items: MagicItemSummary[]): FilterOption[] {
  const slots = [...new Set(items.map((i) => i.slot))].sort();
  return [{ label: 'All', value: '' }, ...slots.map((s) => ({ label: s, value: s }))];
}

/** Build rarity options from current items. */
export function buildRarityOptions(items: MagicItemSummary[]): FilterOption[] {
  const rarities = [...new Set(items.map((i) => i.rarity).filter(Boolean) as string[])].sort();
  return [{ label: 'All', value: '' }, ...rarities.map((r) => ({ label: r, value: r }))];
}
