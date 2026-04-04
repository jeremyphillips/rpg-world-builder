import { LOCATION_MAP_DEFAULT_REGION_NAME } from '@/shared/domain/locations/map/locationMapRegion.constants';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';

export type RegionMetadataFormValues = {
  name: string;
  description: string;
  colorKey: LocationMapRegionColorKey;
};

export type RegionMetadataPersistablePatch = Partial<
  Pick<LocationMapRegionAuthoringEntry, 'name' | 'description' | 'colorKey'>
>;

/** Map workspace draft entry → inspector form values (read path). */
export function regionMetadataToFormValues(
  region: LocationMapRegionAuthoringEntry,
): RegionMetadataFormValues {
  return {
    name: region.name,
    description: region.description ?? '',
    colorKey: region.colorKey,
  };
}

/** Normalization for persisted region fields: trim name; empty description → undefined. */
export function normalizeRegionNameForDraft(raw: string): string {
  const t = raw.trim();
  return t === '' ? LOCATION_MAP_DEFAULT_REGION_NAME : t;
}

export function normalizeRegionDescriptionForDraft(raw: string): string | undefined {
  const t = raw.trim();
  return t === '' ? undefined : t;
}
