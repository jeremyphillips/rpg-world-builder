import type {
  LocationMapCellAuthoringEntry,
  LocationMapCellFillKindId,
  LocationMapCellObjectEntry,
} from '@/shared/domain/locations';

/**
 * Route draft (records keyed by cell id) ↔ persisted `cellEntries` on LocationMap.
 */
export function cellDraftToCellEntries(
  linkedLocationByCellId: Record<string, string | undefined>,
  objectsByCellId: Record<string, LocationMapCellObjectEntry[]>,
  cellFillByCellId: Record<string, LocationMapCellFillKindId | undefined> = {},
  regionIdByCellId: Record<string, string | undefined> = {},
): LocationMapCellAuthoringEntry[] {
  const cellIds = new Set<string>([
    ...Object.keys(linkedLocationByCellId),
    ...Object.keys(objectsByCellId),
    ...Object.keys(cellFillByCellId),
    ...Object.keys(regionIdByCellId),
  ]);
  const out: LocationMapCellAuthoringEntry[] = [];
  for (const cellId of Array.from(cellIds).sort()) {
    const linked = linkedLocationByCellId[cellId]?.trim();
    const objects = objectsByCellId[cellId];
    const fill = cellFillByCellId[cellId];
    const regionId = regionIdByCellId[cellId]?.trim();
    const hasLink = Boolean(linked && linked.length > 0);
    const hasObjs = Boolean(objects && objects.length > 0);
    const hasFill = fill !== undefined && fill !== null && String(fill).trim() !== '';
    const hasRegion = Boolean(regionId && regionId.length > 0);
    if (!hasLink && !hasObjs && !hasFill && !hasRegion) {
      continue;
    }
    const entry: LocationMapCellAuthoringEntry = { cellId };
    if (hasLink) {
      entry.linkedLocationId = linked;
    }
    if (hasObjs && objects) {
      entry.objects = objects.map((o) => ({
        id: o.id,
        kind: o.kind,
        ...(o.label !== undefined && String(o.label).trim() !== ''
          ? { label: String(o.label).trim() }
          : {}),
      }));
    }
    if (hasFill) {
      entry.cellFillKind = fill;
    }
    if (hasRegion) {
      entry.regionId = regionId;
    }
    out.push(entry);
  }
  return out;
}

export function cellEntriesToDraft(entries: LocationMapCellAuthoringEntry[] | undefined): {
  linkedLocationByCellId: Record<string, string | undefined>;
  objectsByCellId: Record<string, LocationMapCellObjectEntry[]>;
  cellFillByCellId: Record<string, LocationMapCellFillKindId | undefined>;
  regionIdByCellId: Record<string, string | undefined>;
} {
  if (!entries || entries.length === 0) {
    return {
      linkedLocationByCellId: {},
      objectsByCellId: {},
      cellFillByCellId: {},
      regionIdByCellId: {},
    };
  }
  const linkedLocationByCellId: Record<string, string | undefined> = {};
  const objectsByCellId: Record<string, LocationMapCellObjectEntry[]> = {};
  const cellFillByCellId: Record<string, LocationMapCellFillKindId | undefined> = {};
  const regionIdByCellId: Record<string, string | undefined> = {};
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
    if (e.cellFillKind !== undefined && e.cellFillKind !== null && String(e.cellFillKind).trim() !== '') {
      cellFillByCellId[e.cellId] = e.cellFillKind;
    }
    if (e.regionId !== undefined && e.regionId !== null && String(e.regionId).trim() !== '') {
      regionIdByCellId[e.cellId] = String(e.regionId).trim();
    }
  }
  return { linkedLocationByCellId, objectsByCellId, cellFillByCellId, regionIdByCellId };
}
