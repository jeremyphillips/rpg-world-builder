/**
 * Square grid only: authored edge entries → boundary segment geometry in pixel space.
 * Hex edge boundaries are not modeled here.
 */
import type { LocationMapEdgeAuthoringEntry } from './locationMap.types';
import type { EdgeSegmentGeometry, LineSegment2D } from './locationMapGeometry.types';
import {
  SQUARE_GRID_GAP_PX,
  squareEdgeSegmentPxFromEdgeId,
} from '../../grid/squareGridOverlayGeometry';

function pxSegmentToLineSegment2D(seg: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): LineSegment2D {
  return { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2 };
}

/** One edge entry → segment, or null if edge id does not resolve for this cell size. */
export function edgeEntryToSegmentGeometrySquare(
  entry: LocationMapEdgeAuthoringEntry,
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): EdgeSegmentGeometry | null {
  const px = squareEdgeSegmentPxFromEdgeId(entry.edgeId, cellPx, gapPx);
  if (!px) return null;
  return {
    edgeId: entry.edgeId,
    kind: entry.kind,
    segment: pxSegmentToLineSegment2D(px),
  };
}

/** Batch: same rules as {@link edgeEntryToSegmentGeometrySquare}. */
export function edgeEntriesToSegmentGeometrySquare(
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[],
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): EdgeSegmentGeometry[] {
  const out: EdgeSegmentGeometry[] = [];
  for (const e of edgeEntries) {
    const g = edgeEntryToSegmentGeometrySquare(e, cellPx, gapPx);
    if (g) out.push(g);
  }
  return out;
}
