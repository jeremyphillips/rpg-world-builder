import type { Gear } from '@/features/content/equipment/gear/domain/types';
import { type DetailSpec, metaAll, metaDmOrPlatformOwner } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import { AppBadge } from '@/ui/primitives';
import { VisibilityBadge } from '@/ui/patterns';

export type GearDetailCtx = Record<string, never>;

export const GEAR_DETAIL_SPECS: DetailSpec<Gear, GearDetailCtx>[] = [
  {
    key: 'source',
    label: 'Source',
    order: 10,
    render: (gear) => (
      <AppBadge
        label={gear.source}
        tone={gear.source === 'system' ? 'info' : 'default'}
      />
    ),
    ...metaAll,
  },
  {
    key: 'visibility',
    label: 'Visibility',
    order: 20,
    render: (gear) =>
      gear.accessPolicy && gear.accessPolicy.scope !== 'public' ? (
        <VisibilityBadge visibility={gear.accessPolicy} />
      ) : (
        'Public'
      ),
    ...metaDmOrPlatformOwner,
  },
  {
    key: 'category',
    label: 'Category',
    order: 10,
    render: (gear) => gear.category,
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 20,
    render: (gear) => formatMoney(gear.cost),
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 30,
    render: (gear) =>
      gear.weight ? `${gear.weight.value} ${gear.weight.unit}` : '—',
  },
  {
    key: 'capacity',
    label: 'Capacity',
    order: 40,
    hidden: (gear) => !gear.capacity,
    render: (gear) => gear.capacity ?? '—',
  },
  {
    key: 'range',
    label: 'Range',
    order: 50,
    hidden: (gear) => !gear.range,
    render: (gear) => gear.range ?? '—',
  },
  {
    key: 'duration',
    label: 'Duration',
    order: 60,
    hidden: (gear) => !gear.duration,
    render: (gear) => gear.duration ?? '—',
  },
  {
    key: 'charges',
    label: 'Charges',
    order: 70,
    hidden: (gear) => !gear.charges,
    render: (gear) => (gear.charges != null ? String(gear.charges) : '—'),
  },
  {
    key: 'effect',
    label: 'Effect',
    order: 80,
    hidden: (gear) => !gear.effect,
    render: (gear) => gear.effect ?? '—',
  },
];
