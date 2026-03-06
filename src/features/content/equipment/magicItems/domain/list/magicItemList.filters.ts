import type { AppDataGridFilter } from '@/ui/patterns';
import type { MagicItemListRow } from './magicItemList.types';
import type { MagicItemSummary } from '@/features/content/shared/domain/types';
import { buildSlotOptions, buildRarityOptions } from './magicItemList.options';

/**
 * Returns custom filters for the magic item list.
 */
export function buildMagicItemCustomFilters(
  items: MagicItemSummary[],
): AppDataGridFilter<MagicItemListRow>[] {
  const slotOptions = buildSlotOptions(items);
  const rarityOptions = buildRarityOptions(items);

  return [
    {
      id: 'slot',
      label: 'Slot',
      type: 'select' as const,
      options: slotOptions,
      accessor: (r: MagicItemListRow) => r.slot,
    },
    {
      id: 'rarity',
      label: 'Rarity',
      type: 'select' as const,
      options: rarityOptions,
      accessor: (r: MagicItemListRow) => r.rarity ?? '',
    },
    {
      id: 'attunement',
      label: 'Attunement',
      type: 'boolean' as const,
      accessor: (r: MagicItemListRow) => r.requiresAttunement,
    },
  ];
}
