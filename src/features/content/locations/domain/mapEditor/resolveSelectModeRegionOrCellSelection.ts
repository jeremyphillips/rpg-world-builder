/**
 * Select-mode fallback after object / path / edge hits: if the cell has a region assignment,
 * select that region; otherwise select the cell.
 *
 * Prefer {@link resolveSelectModeAfterPathEdgeHits} for the full interior priority
 * (objects → linked location → region → bare cell).
 */
export function resolveSelectModeRegionOrCellSelection(
  cellId: string,
  regionIdByCellId: Record<string, string | undefined>,
): { type: 'region'; regionId: string } | { type: 'cell'; cellId: string } {
  const rid = regionIdByCellId[cellId]?.trim();
  if (rid) {
    return { type: 'region', regionId: rid };
  }
  return { type: 'cell', cellId };
}

type Objectish = { id: string };

/**
 * When the click target is the grid cell (not a resolved path/edge), pick by draft content:
 * map objects → linked location → region → bare cell.
 *
 * Complements DOM `closest('[data-map-object-id]')` (icons use `pointer-events: auto` so direct
 * icon hits still resolve first in the handler).
 */
export function resolveSelectModeAfterPathEdgeHits(
  cellId: string,
  objectsByCellId: Record<string, Objectish[] | undefined>,
  linkedLocationByCellId: Record<string, string | undefined>,
  regionIdByCellId: Record<string, string | undefined>,
):
  | { type: 'object'; cellId: string; objectId: string }
  | { type: 'cell'; cellId: string }
  | { type: 'region'; regionId: string } {
  const objs = objectsByCellId[cellId];
  if (objs && objs.length > 0) {
    return { type: 'object', cellId, objectId: objs[0].id };
  }
  if (linkedLocationByCellId[cellId]?.trim()) {
    return { type: 'cell', cellId };
  }
  return resolveSelectModeRegionOrCellSelection(cellId, regionIdByCellId);
}
