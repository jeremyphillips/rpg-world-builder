import type {
  LocationMapCellAuthoringEntry,
  LocationMapCellObjectEntry,
} from '@/shared/domain/locations';

/**
 * Route draft (records keyed by cell id) ↔ persisted `cellEntries` on LocationMap.
 */
export function cellDraftToCellEntries(
  linkedLocationByCellId: Record<string, string | undefined>,
  objectsByCellId: Record<string, LocationMapCellObjectEntry[]>,
): LocationMapCellAuthoringEntry[] {
  const cellIds = new Set<string>([
    ...Object.keys(linkedLocationByCellId),
    ...Object.keys(objectsByCellId),
  ]);
  const out: LocationMapCellAuthoringEntry[] = [];
  for (const cellId of Array.from(cellIds).sort()) {
    const linked = linkedLocationByCellId[cellId]?.trim();
    const objects = objectsByCellId[cellId];
    const hasLink = Boolean(linked && linked.length > 0);
    const hasObjs = Boolean(objects && objects.length > 0);
    if (!hasLink && !hasObjs) continue;
    const entry: LocationMapCellAuthoringEntry = { cellId };
    if (hasLink) entry.linkedLocationId = linked;
    if (hasObjs && objects) {
      entry.objects = objects.map((o) => ({
        id: o.id,
        kind: o.kind,
        ...(o.label !== undefined && String(o.label).trim() !== ''
          ? { label: String(o.label).trim() }
          : {}),
      }));
    }
    out.push(entry);
  }
  return out;
}

export function cellEntriesToDraft(entries: LocationMapCellAuthoringEntry[] | undefined): {
  linkedLocationByCellId: Record<string, string | undefined>;
  objectsByCellId: Record<string, LocationMapCellObjectEntry[]>;
} {
  if (!entries || entries.length === 0) {
    return { linkedLocationByCellId: {}, objectsByCellId: {} };
  }
  const linkedLocationByCellId: Record<string, string | undefined> = {};
  const objectsByCellId: Record<string, LocationCellObjectDraft[]> = {};
  for (const e of entries) {
    if (e.linkedLocationId && e.linkedLocationId.trim()) {
      linkedLocationByCellId[e.cellId] = e.linkedLocationId.trim();
    }
    if (e.objects && e.objects.length > 0) {
      objectsByCellId[e.cellId] = e.objects.map((o) => ({
        id: o.id,
        kind: o.kind,
        ...(o.label !== undefined && o.label !== '' ? { label: o.label } : {}),
      }));
    }
  }
  return { linkedLocationByCellId, objectsByCellId };
}
