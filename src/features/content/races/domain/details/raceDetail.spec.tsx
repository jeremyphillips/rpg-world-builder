import type { Race } from '@/features/content/domain/types';
import type { DetailSpec } from '@/features/content/forms/registry';
import { AppBadge } from '@/ui/primitives';
import { VisibilityBadge } from '@/ui/patterns';

export type RaceDetailCtx = Record<string, never>;

export const RACE_DETAIL_SPECS: DetailSpec<Race, RaceDetailCtx>[] = [
  {
    key: 'source',
    label: 'Source',
    order: 10,
    render: (race) => (
      <AppBadge
        label={race.source}
        tone={race.source === 'system' ? 'info' : 'default'}
      />
    ),
  },
  {
    key: 'visibility',
    label: 'Visibility',
    order: 20,
    render: (race) =>
      race.accessPolicy && race.accessPolicy.scope !== 'public' ? (
        <VisibilityBadge visibility={race.accessPolicy} />
      ) : (
        'Public'
      ),
  },
];
