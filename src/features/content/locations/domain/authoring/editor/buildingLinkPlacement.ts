import type { LocationMapBase } from '@/shared/domain/locations';
import type { Location } from '@/features/content/locations/domain/model/location';

/** Host location scales whose maps may place building markers with `linkedLocationId` (registry + map policy). */
export const LOCATION_MAP_HOST_SCALES_FOR_BUILDING_LINKS = ['city', 'site'] as const;

export type LocationMapHostScaleForBuildingLink =
  (typeof LOCATION_MAP_HOST_SCALES_FOR_BUILDING_LINKS)[number];

export function isLocationMapHostScaleForBuildingLink(scale: string): scale is LocationMapHostScaleForBuildingLink {
  return scale === 'city' || scale === 'site';
}

/**
 * Building location ids that already appear as `linkedLocationId` on some map cell **other than**
 * `(currentMapId, currentCellId)`. Used to disable those options in the link picker (matches server
 * `BUILDING_ALREADY_PLACED` / `DUPLICATE_BUILDING_LINK`).
 */
export function collectBuildingLocationIdsLinkedElsewhere(
  maps: Array<Pick<LocationMapBase, 'id' | 'cellEntries'>>,
  locationsById: Map<string, Location>,
  currentMapId: string,
  currentCellId: string,
): Set<string> {
  const taken = new Set<string>();
  for (const m of maps) {
    const mapId = m.id;
    for (const row of m.cellEntries ?? []) {
      const lid = row.linkedLocationId?.trim();
      if (!lid) continue;
      const loc = locationsById.get(lid);
      if (!loc || loc.scale !== 'building') continue;
      if (mapId === currentMapId && row.cellId === currentCellId) continue;
      taken.add(lid);
    }
  }
  return taken;
}

/** Building ids linked on any cell in `maps` (only counts targets whose `Location.scale === 'building'`). */
export function collectBuildingLocationIdsLinkedOnMaps(
  maps: Array<Pick<LocationMapBase, 'cellEntries'>>,
  locationsById: Map<string, Location>,
): Set<string> {
  const out = new Set<string>();
  for (const m of maps) {
    for (const row of m.cellEntries ?? []) {
      const lid = row.linkedLocationId?.trim();
      if (!lid) continue;
      const loc = locationsById.get(lid);
      if (!loc || loc.scale !== 'building') continue;
      out.add(lid);
    }
  }
  return out;
}
