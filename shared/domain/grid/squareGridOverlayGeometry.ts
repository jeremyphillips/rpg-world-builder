import { makeGridCellId, parseGridCellId } from './gridCellIds';

/** Matches {@link makeUndirectedSquareEdgeKey} persisted edge ids. */
export const BETWEEN_EDGE_ID_RE = /^between:([^|]+)\|([^|]+)$/;

export const SQUARE_GRID_GAP_PX = 4;

/** Pixel center of a square grid cell (gap + equal cell size, matches GridEditor). */
export function squareCellCenterPx(
  cellId: string,
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): { cx: number; cy: number } | null {
  const p = parseGridCellId(cellId);
  if (!p) return null;
  const step = cellPx + gapPx;
  return { cx: p.x * step + cellPx / 2, cy: p.y * step + cellPx / 2 };
}

/**
 * Which square grid cell (if any) contains `(gx, gy)` in grid-local pixels
 * (origin top-left of the grid, same layout as {@link squareCellCenterPx}).
 * Returns null in the inter-cell gap or outside the grid bounds.
 */
export function resolveSquareCellIdFromGridLocalPx(
  gx: number,
  gy: number,
  cellPx: number,
  cols: number,
  rows: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): string | null {
  const step = cellPx + gapPx;
  const ix = Math.floor(gx / step);
  const iy = Math.floor(gy / step);
  const rx = gx - ix * step;
  const ry = gy - iy * step;
  if (rx >= cellPx || ry >= cellPx) return null;
  if (ix < 0 || ix >= cols || iy < 0 || iy >= rows) return null;
  return makeGridCellId(ix, iy);
}

/**
 * Pixel segment on the shared boundary between two orthogonally adjacent cells
 * (centered in the gutter).
 */
export function squareSharedEdgeSegmentPx(
  cellA: string,
  cellB: string,
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const pa = parseGridCellId(cellA);
  const pb = parseGridCellId(cellB);
  if (!pa || !pb) return null;
  const dx = pb.x - pa.x;
  const dy = pb.y - pa.y;
  const step = cellPx + gapPx;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1 && dy === 0) {
    const x = pa.x * step + cellPx + gapPx / 2;
    const y1 = pa.y * step;
    const y2 = pa.y * step + cellPx;
    return { x1: x, y1, x2: x, y2: y2 };
  }
  if (dx === -1 && dy === 0) {
    const x = pb.x * step + cellPx + gapPx / 2;
    const y1 = pa.y * step;
    const y2 = pa.y * step + cellPx;
    return { x1: x, y1, x2: x, y2: y2 };
  }
  if (dx === 0 && dy === 1) {
    const y = pa.y * step + cellPx + gapPx / 2;
    const x1 = pa.x * step;
    const x2 = pa.x * step + cellPx;
    return { x1, y1: y, x2, y2: y };
  }
  if (dx === 0 && dy === -1) {
    const y = pb.y * step + cellPx + gapPx / 2;
    const x1 = pa.x * step;
    const x2 = pa.x * step + cellPx;
    return { x1, y1: y, x2, y2: y };
  }
  return null;
}

/** Pixel segment for a canonical `between:cellA|cellB` edge id. */
export function squareEdgeSegmentPxFromEdgeId(
  edgeId: string,
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const m = BETWEEN_EDGE_ID_RE.exec(edgeId);
  if (!m) return null;
  return squareSharedEdgeSegmentPx(m[1].trim(), m[2].trim(), cellPx, gapPx);
}
