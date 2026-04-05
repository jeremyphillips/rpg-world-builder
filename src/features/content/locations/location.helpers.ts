import {
  getLocationScaleRank,
  LOCATION_SCALE_RANK_ORDER_LEGACY,
} from '@/shared/domain/locations';

import type { Location } from '@/features/content/locations/domain/model/location'

/**
 * Sort locations by structural scale, then name. Uses `scale` for ordering.
 */
export function sortLocations(a: Location, b: Location): number {
  const scaleDiff =
    LOCATION_SCALE_RANK_ORDER_LEGACY.indexOf(a.scale as (typeof LOCATION_SCALE_RANK_ORDER_LEGACY)[number]) -
    LOCATION_SCALE_RANK_ORDER_LEGACY.indexOf(b.scale as (typeof LOCATION_SCALE_RANK_ORDER_LEGACY)[number])

  if (scaleDiff !== 0) return scaleDiff

  return a.name.localeCompare(b.name)
}

export function getIndentLevel(location: { scale: Location['scale'] }): number {
  const i = getLocationScaleRank(location.scale);
  return i >= 0 ? i : 0;
}
