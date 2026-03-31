import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';

/** Matches {@link makeUndirectedSquareEdgeKey} persisted edge ids. */
export const BETWEEN_EDGE_ID_RE = /^between:([^|]+)\|([^|]+)$/;

export const SQUARE_GRID_GAP_PX = 4;

/** Pixel center of a square grid cell (gap + equal cell size, matches GridEditor). */
export function squareCellCenterPx(
  cellId: string,
  cellPx: number,
): { cx: number; cy: number } | null {
  const p = parseGridCellId(cellId);
  if (!p) return null;
  const step = cellPx + SQUARE_GRID_GAP_PX;
  return { cx: p.x * step + cellPx / 2, cy: p.y * step + cellPx / 2 };
}

/**
 * Pixel segment on the shared boundary between two orthogonally adjacent cells
 * (centered in the gutter).
 */
export function squareSharedEdgeSegmentPx(
  cellA: string,
  cellB: string,
  cellPx: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const pa = parseGridCellId(cellA);
  const pb = parseGridCellId(cellB);
  if (!pa || !pb) return null;
  const dx = pb.x - pa.x;
  const dy = pb.y - pa.y;
  const step = cellPx + SQUARE_GRID_GAP_PX;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
  if (dx === 1 && dy === 0) {
    const x = pa.x * step + cellPx + SQUARE_GRID_GAP_PX / 2;
    const y1 = pa.y * step;
    const y2 = pa.y * step + cellPx;
    return { x1: x, y1, x2: x, y2: y2 };
  }
  if (dx === -1 && dy === 0) {
    const x = pb.x * step + cellPx + SQUARE_GRID_GAP_PX / 2;
    const y1 = pa.y * step;
    const y2 = pa.y * step + cellPx;
    return { x1: x, y1, x2: x, y2: y2 };
  }
  if (dx === 0 && dy === 1) {
    const y = pa.y * step + cellPx + SQUARE_GRID_GAP_PX / 2;
    const x1 = pa.x * step;
    const x2 = pa.x * step + cellPx;
    return { x1, y1: y, x2, y2: y };
  }
  if (dx === 0 && dy === -1) {
    const y = pb.y * step + cellPx + SQUARE_GRID_GAP_PX / 2;
    const x1 = pa.x * step;
    const x2 = pa.x * step + cellPx;
    return { x1, y1: y, x2, y2: y };
  }
  return null;
}
