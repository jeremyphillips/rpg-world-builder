import { LOCATION_SCALE_ORDER } from '@/shared/domain/locations'

import type { Location } from '@/features/content/locations/domain/types'

/**
 * Sort locations by structural scale, then name. Uses `scale` for ordering.
 */
export function sortLocations(a: Location, b: Location): number {
  const scaleDiff =
    LOCATION_SCALE_ORDER.indexOf(a.scale) - LOCATION_SCALE_ORDER.indexOf(b.scale)

  if (scaleDiff !== 0) return scaleDiff

  return a.name.localeCompare(b.name)
}

export function getIndentLevel(location: { scale: Location['scale'] }): number {
  const i = LOCATION_SCALE_ORDER.indexOf(location.scale)
  return i >= 0 ? i : 0
}
