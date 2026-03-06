import type { Weapon } from '@/features/content/shared/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import { AppBadge } from '@/ui/primitives';

export type WeaponDetailCtx = Record<string, never>;

export const WEAPON_DETAIL_SPECS: DetailSpec<Weapon, WeaponDetailCtx>[] = [
  {
    key: 'category',
    label: 'Category',
    order: 10,
    render: (weapon) => weapon.category,
  },
  {
    key: 'mode',
    label: 'Mode',
    order: 20,
    render: (weapon) => weapon.mode,
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 30,
    render: (weapon) => formatMoney(weapon.cost),
  },
  {
    key: 'damage',
    label: 'Damage',
    order: 40,
    render: (weapon) =>
      weapon.damage?.versatile
        ? `${weapon.damage.default} (${weapon.damage.versatile} versatile)`
        : weapon.damage?.default ?? '—',
  },
  {
    key: 'damageType',
    label: 'Damage Type',
    order: 50,
    render: (weapon) => weapon.damageType ?? '—',
  },
  {
    key: 'properties',
    label: 'Properties',
    order: 70,
    render: (weapon) => weapon.properties?.join(', ') ?? '—',
  },
  {
    key: 'range',
    label: 'Range',
    order: 80,
    render: (weapon) =>
      weapon.range
        ? `${weapon.range.normal}/${weapon.range.long ?? '—'} ft`
        : '—',
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 90,
    render: (weapon) =>
      weapon.weight ? `${weapon.weight.value} ${weapon.weight.unit}` : '—',
  },
  {
    key: 'source',
    label: 'Source',
    order: 100,
    render: (weapon) => (
      <AppBadge
        label={weapon.source}
        tone={weapon.source === 'system' ? 'info' : 'default'}
      />
    ),
  },
];
