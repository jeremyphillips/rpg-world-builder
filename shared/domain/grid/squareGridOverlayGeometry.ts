import { makeGridCellId, parseGridCellId } from './gridCellIds';
import { parseSquareEdgeId, type SquareCellSide } from './gridEdgeIds';

export { BETWEEN_EDGE_ID_RE, PERIMETER_EDGE_ID_RE } from './gridEdgeIds';

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
 * Cell id for select-mode anchor when the pointer may be in an inter-cell gutter.
 * Uses strict in-cell resolution first; if that returns null but `(gx,gy)` is still inside the
 * grid bounds, maps to the cell in the grid block containing the point (same `floor` as cell
 * origin index) so edge/path hit-testing can run in gutters.
 */
export function resolveSquareAnchorCellIdForSelectPx(
  gx: number,
  gy: number,
  cellPx: number,
  cols: number,
  rows: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): string | null {
  const step = cellPx + gapPx;
  const totalW = cols * cellPx + Math.max(0, cols - 1) * gapPx;
  const totalH = rows * cellPx + Math.max(0, rows - 1) * gapPx;
  if (gx < 0 || gy < 0 || gx >= totalW || gy >= totalH) return null;
  const inside = resolveSquareCellIdFromGridLocalPx(gx, gy, cellPx, cols, rows, gapPx);
  if (inside) return inside;
  const ix = Math.min(cols - 1, Math.max(0, Math.floor(gx / step)));
  const iy = Math.min(rows - 1, Math.max(0, Math.floor(gy / step)));
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

/**
 * Pixel segment on the **outer** boundary of the grid for a cell side with no neighbor
 * (along the cell's outer edge — matches map border).
 */
export function squarePerimeterEdgeSegmentPx(
  cellId: string,
  side: SquareCellSide,
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const p = parseGridCellId(cellId);
  if (!p) return null;
  const step = cellPx + gapPx;
  const x0 = p.x * step;
  const y0 = p.y * step;
  if (side === 'N') {
    const y = y0;
    return { x1: x0, y1: y, x2: x0 + cellPx, y2: y };
  }
  if (side === 'S') {
    const y = y0 + cellPx;
    return { x1: x0, y1: y, x2: x0 + cellPx, y2: y };
  }
  if (side === 'W') {
    const x = x0;
    return { x1: x, y1: y0, x2: x, y2: y0 + cellPx };
  }
  if (side === 'E') {
    const x = x0 + cellPx;
    return { x1: x, y1: y0, x2: x, y2: y0 + cellPx };
  }
  return null;
}

/** Pixel segment for a canonical interior `between:` or outer `perimeter:` edge id. */
export function squareEdgeSegmentPxFromEdgeId(
  edgeId: string,
  cellPx: number,
  gapPx: number = SQUARE_GRID_GAP_PX,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const parsed = parseSquareEdgeId(edgeId);
  if (!parsed) return null;
  if (parsed.kind === 'between') {
    return squareSharedEdgeSegmentPx(parsed.cellA, parsed.cellB, cellPx, gapPx);
  }
  return squarePerimeterEdgeSegmentPx(parsed.cellId, parsed.side, cellPx, gapPx);
}
