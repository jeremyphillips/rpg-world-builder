import { hexExposedRegionBoundarySegments } from './hexRegionBoundarySegments';

/** Boundary polylines for cells assigned to a region id (hex authoring overlay). */
export function hexBoundarySegmentsForRegionCells(
  cols: number,
  rows: number,
  hexSize: number,
  regionId: string,
  regionIdByCellId: Record<string, string | undefined>,
) {
  const ids = new Set<string>();
  for (const [cid, r] of Object.entries(regionIdByCellId)) {
    if (r?.trim() === regionId) {
      ids.add(cid);
    }
  }
  if (ids.size === 0) {
    return [];
  }
  return hexExposedRegionBoundarySegments(cols, rows, ids, hexSize);
}
