import { getAllowedLinkedLocationOptions } from '@/shared/domain/locations';
import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import type { LocationMapPendingPlacement } from '@/features/content/locations/domain/authoring/editor';

export type LocationEditLinkModalSelectOption = { value: string; label: string };

/**
 * Options for the linked-location picker when placing a link from the map (campaign locations only).
 */
export function buildLocationEditLinkModalSelectOptions(args: {
  campaignId: string | undefined;
  loc: LocationContentItem | null;
  locations: Location[];
  mapHostLocationIdResolved: string;
  mapHostScaleResolved: string;
  pendingPlacement: LocationMapPendingPlacement;
}): LocationEditLinkModalSelectOption[] {
  const {
    campaignId,
    loc,
    locations,
    mapHostLocationIdResolved,
    mapHostScaleResolved,
    pendingPlacement: p,
  } = args;

  if (!campaignId || !loc || loc.source !== 'campaign') return [];
  if (!p || p.type !== 'linked-location') return [];
  const targetScale = p.linkedScale;
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
