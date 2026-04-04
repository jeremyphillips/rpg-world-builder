import type { LocationStairEndpointRef } from '@/shared/domain/locations';

import { listLocationMaps, updateLocationMap } from '@/features/content/locations/domain/repo/locationMapRepo';

import { patchStairObjectConnectionIdInCellEntries } from './mapCellEntriesStairConnection';

function cellEntriesPatchChanged(
  before: Parameters<typeof patchStairObjectConnectionIdInCellEntries>[0],
  after: ReturnType<typeof patchStairObjectConnectionIdInCellEntries>,
): boolean {
  return JSON.stringify(before ?? []) !== JSON.stringify(after);
}

/**
 * PATCHs the floor map that actually contains this stair object’s cell (any encounter-grid / world map).
 * Previously only the default map was updated, so stairs on a non-default encounter map never persisted `connectionId`.
 */
export async function patchFloorStairConnectionIdOnDefaultMap(
  campaignId: string,
  ref: LocationStairEndpointRef,
  connectionId: string | null,
): Promise<void> {
  const maps = await listLocationMaps(campaignId, ref.floorLocationId);
  if (maps.length === 0) return;

  for (const map of maps) {
    const next = patchStairObjectConnectionIdInCellEntries(map.cellEntries, ref, connectionId);
    if (cellEntriesPatchChanged(map.cellEntries, next)) {
      await updateLocationMap(campaignId, ref.floorLocationId, map.id, { cellEntries: next });
      return;
    }
  }

  const fallback = maps.find((m) => m.isDefault) ?? maps[0];
  if (!fallback) return;
  const cellEntries = patchStairObjectConnectionIdInCellEntries(fallback.cellEntries, ref, connectionId);
  if (!cellEntriesPatchChanged(fallback.cellEntries, cellEntries)) return;
  await updateLocationMap(campaignId, ref.floorLocationId, fallback.id, { cellEntries });
}
