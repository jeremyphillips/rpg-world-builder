import { getAllowedLinkedLocationOptions } from '@/shared/domain/locations';
import type { LocationScaleId } from '@/shared/domain/locations';
import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

export type LinkedLocationPickerOption = { value: string; label: string };

/**
 * Campaign locations allowed as a link target for a given registry `linkedScale`, matching map link policy.
 */
export function buildLinkedLocationPickerOptions(args: {
  campaignId: string | undefined;
  loc: LocationContentItem | null;
  locations: Location[];
  mapHostLocationIdResolved: string;
  mapHostScaleResolved: string;
  linkedScale: LocationScaleId;
}): LinkedLocationPickerOption[] {
  const {
    campaignId,
    loc,
    locations,
    mapHostLocationIdResolved,
    mapHostScaleResolved,
    linkedScale: targetScale,
  } = args;

  if (!campaignId || !loc || loc.source !== 'campaign') return [];
  const campaignLocations = locations.filter((l) => l.source === 'campaign');
  const host = {
    id: mapHostLocationIdResolved || '__host__',
    scale: mapHostScaleResolved,
    name: loc.name,
    source: 'campaign' as const,
    campaignId,
  };
  return getAllowedLinkedLocationOptions(host, campaignLocations, {
    campaignId,
    excludeLocationId: mapHostLocationIdResolved || undefined,
  })
    .filter((l) => l.scale === targetScale)
    .map((l) => ({ value: l.id, label: l.name }));
}
