import { makeGridCellId, parseGridCellId } from './gridCellIds';

export type SquareCellSide = 'N' | 'E' | 'S' | 'W';

/**
 * Canonical undirected edge key between two adjacent square cells (lexicographic pair).
 */
export function makeUndirectedSquareEdgeKey(cellIdA: string, cellIdB: string): string {
  const a = cellIdA.trim();
  const b = cellIdB.trim();
  return a <= b ? `between:${a}|${b}` : `between:${b}|${a}`;
}

/** Adjacent orthogonal neighbor of a square cell, or null if out of bounds / invalid. */
export function neighborSquareCellId(
  cellId: string,
  side: SquareCellSide,
  columns: number,
  rows: number,
): string | null {
  const p = parseGridCellId(cellId);
  if (!p) return null;
  let { x, y } = p;
  if (side === 'N') y -= 1;
  if (side === 'S') y += 1;
  if (side === 'W') x -= 1;
  if (side === 'E') x += 1;
  if (x < 0 || y < 0 || x >= columns || y >= rows) return null;
  return makeGridCellId(x, y);
}

/**
 * Edge key from a cell + side toward an in-bounds neighbor.
 */
export function edgeKeyFromCellAndSide(
  cellId: string,
  side: SquareCellSide,
  columns: number,
  rows: number,
): string | null {
  const n = neighborSquareCellId(cellId, side, columns, rows);
  if (!n) return null;
  return makeUndirectedSquareEdgeKey(cellId, n);
}
