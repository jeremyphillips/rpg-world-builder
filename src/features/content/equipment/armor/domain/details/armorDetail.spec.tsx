import type { Armor } from '@/features/content/domain/types';
import type { DetailSpec } from '@/features/content/forms/registry';
import { formatMoney } from '@/shared/money';
import { AppBadge } from '@/ui/primitives';

export type ArmorDetailCtx = {
  dexLabel: string;
};

export const ARMOR_DETAIL_SPECS: DetailSpec<Armor, ArmorDetailCtx>[] = [
  {
    key: 'category',
    label: 'Category',
    order: 10,
    render: (armor) => armor.category,
  },
  {
    key: 'material',
    label: 'Material',
    order: 20,
    render: (armor) => armor.material,
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 30,
    render: (armor) => formatMoney(armor.cost),
  },
  {
    key: 'baseAC',
    label: 'Base AC',
    order: 40,
    render: (armor) =>
      armor.baseAC != null ? String(armor.baseAC) : '—',
  },
  {
    key: 'acBonus',
    label: 'AC Bonus',
    order: 50,
    render: (armor) =>
      armor.acBonus != null ? `+${armor.acBonus}` : '—',
  },
  {
    key: 'dex',
    label: 'Dex Contribution',
    order: 60,
    render: (_armor, ctx) => ctx.dexLabel,
  },
  {
    key: 'stealthDisadvantage',
    label: 'Stealth Disadvantage',
    order: 70,
    render: (armor) => (armor.stealthDisadvantage ? 'Yes' : 'No'),
  },
  {
    key: 'minStrength',
    label: 'Min Strength',
    order: 80,
    render: (armor) =>
      armor.minStrength != null ? String(armor.minStrength) : '—',
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 90,
    render: (armor) =>
      armor.weight ? `${armor.weight.value} ${armor.weight.unit}` : '—',
  },
  {
    key: 'source',
    label: 'Source',
    order: 100,
    render: (armor) => (
      <AppBadge
        label={armor.source}
        tone={armor.source === 'system' ? 'info' : 'default'}
      />
    ),
  },
];
