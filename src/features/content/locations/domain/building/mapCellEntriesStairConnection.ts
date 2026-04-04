/**
 * Mutates authored `cellEntries` to set or clear `stairEndpoint.connectionId` for a specific stair object.
 * Used when applying canonical {@link LocationVerticalStairConnection} pairing across floor maps.
 */
import type { LocationStairEndpointRef } from '@/shared/domain/locations';
import type { LocationMapCellAuthoringEntry } from '@/shared/domain/locations/map/locationMap.types';
import { LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION } from '@/shared/domain/locations/map/locationMapStairEndpoint.types';

export function patchStairObjectConnectionIdInCellEntries(
  cellEntries: LocationMapCellAuthoringEntry[] | undefined,
  ref: LocationStairEndpointRef,
  connectionId: string | null,
): LocationMapCellAuthoringEntry[] {
  const list = [...(cellEntries ?? [])];
  const refCell = ref.cellId.trim();
  const rowIdx = list.findIndex((e) => e.cellId.trim() === refCell);
  if (rowIdx < 0) return list;

  const row = list[rowIdx];
  const objects = row.objects ?? [];
  let changed = false;
  const nextObjects = objects.map((o) => {
    if (o.id !== ref.objectId || o.kind !== 'stairs') return o;
    changed = true;
    const base = o.stairEndpoint ?? { direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION };
    if (connectionId === null) {
      const nextSe = {
        direction: base.direction,
        ...(base.targetLocationId?.trim() ? { targetLocationId: base.targetLocationId.trim() } : {}),
      };
      return { ...o, stairEndpoint: nextSe };
    }
    return {
      ...o,
      stairEndpoint: {
        direction: base.direction,
        connectionId,
        ...(base.targetLocationId?.trim() ? { targetLocationId: base.targetLocationId.trim() } : {}),
      },
    };
  });
  if (!changed) return list;
  list[rowIdx] = { ...row, objects: nextObjects };
  return list;
}
