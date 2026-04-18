import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import { contentDetailMetaSpecs, contentDetailPatchedMetaSpecs } from '@/features/content/shared/domain';
import type { DetailSpec } from '@/features/content/shared/forms/registry';

export type LocationDetailCtx = {
  /** e.g. "16 × 12, 5ft" when a default map exists */
  mapGridSummary?: string | null;
};

const formatList = (v: string[] | undefined): string =>
  v?.length ? v.join(', ') : '—';

function locationAdvancedRecord(loc: LocationContentItem): Record<string, unknown> {
  const scopeMeta: Record<string, unknown> =
    loc.source === 'system'
      ? { systemId: loc.systemId }
      : { campaignId: loc.campaignId };

  return {
    id: loc.id,
    name: loc.name,
    source: loc.source,
    patched: loc.patched,
    ...scopeMeta,
    accessPolicy: loc.accessPolicy,
    description: loc.description,
    imageKey: loc.imageKey,
    scale: loc.scale,
    category: loc.category,
    parentId: loc.parentId,
    ancestorIds: loc.ancestorIds,
    sortOrder: loc.sortOrder,
    label: loc.label,
    aliases: loc.aliases,
    tags: loc.tags,
    connections: loc.connections,
    buildingMeta: loc.buildingMeta,
    buildingStructure: loc.buildingStructure,
  };
}

export const LOCATION_DETAIL_SPECS: DetailSpec<LocationContentItem, LocationDetailCtx>[] = [
  ...contentDetailMetaSpecs<LocationContentItem, LocationDetailCtx>(),
  ...contentDetailPatchedMetaSpecs<LocationContentItem, LocationDetailCtx>(),
  {
    key: 'description',
    label: 'Description',
    order: 40,
    hidden: (loc) => !loc.description?.trim(),
    render: (loc) => (
      <span style={{ whiteSpace: 'pre-line' }}>{loc.description}</span>
    ),
  },
  {
    key: 'scale',
    label: 'Scale',
    order: 45,
    render: (loc) => loc.scale,
  },
  {
    key: 'category',
    label: 'Category',
    order: 50,
    render: (loc) => loc.category ?? '—',
  },
  {
    key: 'mapGrid',
    label: 'Grid',
    order: 52,
    render: (_loc, ctx) => ctx.mapGridSummary ?? '—',
  },
  {
    key: 'parentId',
    label: 'Parent',
    order: 55,
    render: (loc) => loc.parentId ?? '—',
  },
  {
    key: 'ancestorIds',
    label: 'Ancestor ids',
    order: 60,
    render: (loc) => formatList(loc.ancestorIds),
  },
  {
    key: 'sortOrder',
    label: 'Sort order',
    order: 65,
    render: (loc) => (loc.sortOrder != null ? String(loc.sortOrder) : '—'),
  },
  {
    key: 'label',
    label: 'Label',
    order: 70,
    render: (loc) =>
      loc.label?.short || loc.label?.number
        ? [loc.label?.short, loc.label?.number].filter(Boolean).join(' · ')
        : '—',
  },
  {
    key: 'aliases',
    label: 'Aliases',
    order: 75,
    render: (loc) => formatList(loc.aliases),
  },
  {
    key: 'tags',
    label: 'Tags',
    order: 80,
    render: (loc) => formatList(loc.tags),
  },
  {
    key: 'locationRawRecord',
    label: 'Full record (JSON)',
    order: 2000,
    placement: 'advanced',
    rawAudience: 'platformOwner',
    getValue: (loc) => locationAdvancedRecord(loc),
  },
];
