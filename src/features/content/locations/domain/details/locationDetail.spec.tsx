import type { Location } from '@/features/content/locations/domain/types';
import type { DetailSpec } from '@/features/content/shared/forms/registry';
import { AppBadge } from '@/ui/primitives';
import { VisibilityBadge } from '@/ui/patterns';

export type LocationDetailCtx = {
  /** e.g. "16 × 12, 5ft" when a default map exists */
  mapGridSummary?: string | null;
};

const formatList = (v: string[] | undefined): string =>
  v?.length ? v.join(', ') : '—';

export const LOCATION_DETAIL_SPECS: DetailSpec<Location, LocationDetailCtx>[] = [
  {
    key: 'source',
    label: 'Source',
    order: 10,
    render: (loc) => (
      <AppBadge label={loc.source} tone={loc.source === 'system' ? 'info' : 'default'} />
    ),
  },
  {
    key: 'visibility',
    label: 'Visibility',
    order: 15,
    render: (loc) =>
      loc.accessPolicy && loc.accessPolicy.scope !== 'public' ? (
        <VisibilityBadge visibility={loc.accessPolicy} />
      ) : (
        'Public'
      ),
  },
  {
    key: 'scale',
    label: 'Scale',
    order: 20,
    render: (loc) => loc.scale,
  },
  {
    key: 'category',
    label: 'Category',
    order: 25,
    render: (loc) => loc.category ?? '—',
  },
  {
    key: 'mapGrid',
    label: 'Grid',
    order: 26,
    render: (_loc, ctx) => ctx.mapGridSummary ?? '—',
  },
  {
    key: 'parentId',
    label: 'Parent',
    order: 30,
    render: (loc) => loc.parentId ?? '—',
  },
  {
    key: 'ancestorIds',
    label: 'Ancestor ids',
    order: 35,
    render: (loc) => formatList(loc.ancestorIds),
  },
  {
    key: 'sortOrder',
    label: 'Sort order',
    order: 40,
    render: (loc) => (loc.sortOrder != null ? String(loc.sortOrder) : '—'),
  },
  {
    key: 'label',
    label: 'Label',
    order: 45,
    render: (loc) =>
      loc.label?.short || loc.label?.number
        ? [loc.label?.short, loc.label?.number].filter(Boolean).join(' · ')
        : '—',
  },
  {
    key: 'aliases',
    label: 'Aliases',
    order: 50,
    render: (loc) => formatList(loc.aliases),
  },
  {
    key: 'tags',
    label: 'Tags',
    order: 55,
    render: (loc) => formatList(loc.tags),
  },
];
