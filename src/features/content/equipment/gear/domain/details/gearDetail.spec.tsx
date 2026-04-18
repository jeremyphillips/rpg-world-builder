import type { Gear } from '@/features/content/equipment/gear/domain/types';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { structuredMainAndAdvanced } from '@/features/content/shared/forms/registry';
import { formatMoney } from '@/shared/money';
import {
  GEAR_CATEGORY_OPTIONS,
  GEAR_PROPERTY_OPTIONS,
} from '@/features/content/equipment/gear/domain/vocab/gear.vocab';

export type GearDetailCtx = Record<string, never>;

function gearCategoryLabel(category: Gear['category']): string {
  return GEAR_CATEGORY_OPTIONS.find((o) => o.id === category)?.name ?? category;
}

function gearPropertiesFriendly(value: unknown): string {
  const arr = value as Gear['properties'];
  if (!arr?.length) return '—';
  return arr
    .map((id) => GEAR_PROPERTY_OPTIONS.find((o) => o.id === id)?.name ?? id)
    .join(', ');
}

/** Platform-admin advanced JSON: stable snapshot of persisted-relevant fields. */
function gearAdvancedRecord(gear: Gear): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    gear.source === 'system'
      ? { systemId: (gear as Gear & { systemId?: string }).systemId }
      : { campaignId: (gear as Gear & { campaignId?: string }).campaignId };

  return {
    id: gear.id,
    name: gear.name,
    source: gear.source,
    patched: gear.patched,
    ...scopeMeta,
    accessPolicy: gear.accessPolicy,
    category: gear.category,
    cost: gear.cost,
    weight: gear.weight,
    description: gear.description,
    imageKey: gear.imageKey,
    properties: gear.properties,
    proficiency: gear.proficiency,
    kind: gear.kind,
    capacity: gear.capacity,
    range: gear.range,
    duration: gear.duration,
    charges: gear.charges,
    effect: gear.effect,
    hp: gear.hp,
    burstDC: gear.burstDC,
    pages: gear.pages,
    type: gear.type,
  };
}

export const GEAR_DETAIL_SPECS: DetailSpec<Gear, GearDetailCtx>[] = [
  ...contentDetailMetaSpecs<Gear, GearDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<Gear, GearDetailCtx>(),
  {
    key: 'category',
    label: 'Category',
    order: 40,
    render: (gear) => gearCategoryLabel(gear.category),
  },
  {
    key: 'cost',
    label: 'Cost',
    order: 50,
    render: (gear) => formatMoney(gear.cost),
  },
  {
    key: 'weight',
    label: 'Weight',
    order: 60,
    render: (gear) =>
      gear.weight ? `${gear.weight.value} ${gear.weight.unit}` : '—',
  },
  {
    key: 'description',
    label: 'Description',
    order: 70,
    hidden: (gear) => !gear.description?.trim(),
    render: (gear) => (
      <span style={{ whiteSpace: 'pre-line' }}>{gear.description}</span>
    ),
  },
  {
    key: 'properties',
    label: 'Properties',
    order: 75,
    getValue: (g) => g.properties,
    renderFriendly: (v) => gearPropertiesFriendly(v),
    ...structuredMainAndAdvanced,
    hideIfEmpty: true,
  },
  {
    key: 'proficiency',
    label: 'Tool proficiency',
    order: 76,
    hidden: (g) => !g.proficiency,
    render: (g) => g.proficiency ?? '—',
  },
  {
    key: 'kind',
    label: 'Kind',
    order: 77,
    hidden: (g) => !g.kind,
    render: (g) => g.kind ?? '—',
  },
  {
    key: 'capacity',
    label: 'Capacity',
    order: 80,
    hidden: (gear) => !gear.capacity,
    render: (gear) => gear.capacity ?? '—',
  },
  {
    key: 'range',
    label: 'Range',
    order: 90,
    hidden: (gear) => !gear.range,
    render: (gear) => gear.range ?? '—',
  },
  {
    key: 'duration',
    label: 'Duration',
    order: 100,
    hidden: (gear) => !gear.duration,
    render: (gear) => gear.duration ?? '—',
  },
  {
    key: 'charges',
    label: 'Charges',
    order: 110,
    hidden: (gear) => gear.charges == null,
    render: (gear) => (gear.charges != null ? String(gear.charges) : '—'),
  },
  {
    key: 'effect',
    label: 'Effect',
    order: 120,
    hidden: (gear) => !gear.effect,
    render: (gear) => gear.effect ?? '—',
  },
  {
    key: 'hp',
    label: 'HP',
    order: 125,
    hidden: (g) => g.hp == null,
    render: (g) => String(g.hp ?? '—'),
  },
  {
    key: 'burstDC',
    label: 'Burst DC',
    order: 126,
    hidden: (g) => g.burstDC == null,
    render: (g) => String(g.burstDC ?? '—'),
  },
  {
    key: 'pages',
    label: 'Pages',
    order: 127,
    hidden: (g) => g.pages == null,
    render: (g) => String(g.pages ?? '—'),
  },
  {
    key: 'type',
    label: 'Type',
    order: 128,
    hidden: (g) => !g.type,
    render: (g) => g.type ?? '—',
  },
  {
    key: 'gearRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (g) => gearAdvancedRecord(g),
  },
];
