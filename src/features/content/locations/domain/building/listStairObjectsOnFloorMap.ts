/**
 * Reads authored floor maps to list stair endpoints for pairing UI (Phase 2).
 * Not used for combat traversal.
 */
import { listLocationMaps } from '@/features/content/locations/domain/repo/locationMapRepo';

export type StairObjectOption = {
  value: string;
  label: string;
  cellId: string;
  objectId: string;
};

/**
 * Returns stair objects across all maps for a floor (default + non-default encounter grids), for link pickers.
 */
export async function listStairObjectOptionsForFloor(
  campaignId: string,
  floorLocationId: string,
): Promise<StairObjectOption[]> {
  const maps = await listLocationMaps(campaignId, floorLocationId);
  const out: StairObjectOption[] = [];
  const seenObjectIds = new Set<string>();
  for (const map of maps) {
    if (!map.cellEntries?.length) continue;
    for (const row of map.cellEntries) {
      for (const o of row.objects ?? []) {
        if (o.kind !== 'stairs') continue;
        if (seenObjectIds.has(o.id)) continue;
        seenObjectIds.add(o.id);
        const mapHint = map.isDefault ? '' : ` (${map.name})`;
        out.push({
          objectId: o.id,
          cellId: row.cellId,
          value: `${row.cellId}::${o.id}`,
          label: `Cell ${row.cellId}${mapHint}${o.label ? ` — ${o.label}` : ''}`,
        });
      }
    }
  }
  return out;
}

export function parseStairObjectOptionValue(value: string): { cellId: string; objectId: string } | null {
  const idx = value.indexOf('::');
  if (idx <= 0) return null;
  const cellId = value.slice(0, idx);
  const objectId = value.slice(idx + 2);
  if (!cellId || !objectId) return null;
  return { cellId, objectId };
}
