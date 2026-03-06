import type { MagicItem } from '@/features/content/shared/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import { AppBadge } from '@/ui/primitives';

export type MagicItemDetailCtx = Record<string, never>;

export const MAGIC_ITEM_DETAIL_SPECS: DetailSpec<MagicItem, MagicItemDetailCtx>[] = [
  {
    key: 'slot',
    label: 'Slot',
    order: 10,
    render: (item) => item.slot,
  },
  {
    key: 'rarity',
    label: 'Rarity',
    order: 20,
    render: (item) => item.rarity ?? '—',
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 30,
    render: (item) => (item.cost ? formatMoney(item.cost) : '—'),
  },
  {
    key: 'requiresAttunement',
    label: 'Requires Attunement',
    order: 40,
    render: (item) => (item.requiresAttunement ? 'Yes' : 'No'),
  },
  {
    key: 'bonus',
    label: 'Bonus',
    order: 50,
    render: (item) => (item.bonus != null ? `+${item.bonus}` : '—'),
  },
  {
    key: 'charges',
    label: 'Charges',
    order: 60,
    render: (item) => (item.charges != null ? String(item.charges) : '—'),
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 90,
    render: (item) =>
      item.weight ? `${item.weight.value} ${item.weight.unit}` : '—',
  },
  {
    key: 'source',
    label: 'Source',
    order: 100,
    render: (item) => (
      <AppBadge
        label={item.source}
        tone={item.source === 'system' ? 'info' : 'default'}
      />
    ),
  },
];
