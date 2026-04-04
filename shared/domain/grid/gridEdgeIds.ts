import { makeGridCellId, parseGridCellId } from './gridCellIds';

export type SquareCellSide = 'N' | 'E' | 'S' | 'W';

/** Matches {@link makeUndirectedSquareEdgeKey} persisted interior edge ids. */
export const BETWEEN_EDGE_ID_RE = /^between:([^|]+)\|([^|]+)$/;

/**
 * Matches {@link makePerimeterSquareEdgeKey} — outer grid boundary (no neighbor outside the map).
 * Format: `perimeter:<cellId>|<N|E|S|W>`.
 */
export const PERIMETER_EDGE_ID_RE = /^perimeter:([^|]+)\|(N|E|S|W)$/;

export type ParsedSquareEdgeId =
  | { kind: 'between'; cellA: string; cellB: string }
  | { kind: 'perimeter'; cellId: string; side: SquareCellSide };

/**
 * Parse an interior `between:` or perimeter `perimeter:` edge id.
 */
export function parseSquareEdgeId(edgeId: string): ParsedSquareEdgeId | null {
  const m = BETWEEN_EDGE_ID_RE.exec(edgeId.trim());
  if (m) {
    return { kind: 'between', cellA: m[1]!.trim(), cellB: m[2]!.trim() };
  }
  const p = PERIMETER_EDGE_ID_RE.exec(edgeId.trim());
  if (p) {
    const side = p[2] as SquareCellSide;
    if (side !== 'N' && side !== 'E' && side !== 'S' && side !== 'W') return null;
    return { kind: 'perimeter', cellId: p[1]!.trim(), side };
  }
  return null;
}

/**
 * Canonical undirected edge key between two adjacent square cells (lexicographic pair).
 */
export function makeUndirectedSquareEdgeKey(cellIdA: string, cellIdB: string): string {
  const a = cellIdA.trim();
  const b = cellIdB.trim();
  return a <= b ? `between:${a}|${b}` : `between:${b}|${a}`;
}

/** Canonical id for an outer boundary segment (cell + side facing outside the grid). */
export function makePerimeterSquareEdgeKey(cellId: string, side: SquareCellSide): string {
  return `perimeter:${cellId.trim()}|${side}`;
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
 * Canonical edge key for a cell boundary segment:
 * - **Interior** (neighbor exists): `between:cellA|cellB` (undirected).
 * - **Perimeter** (no neighbor): `perimeter:cellId|side`.
 */
export function edgeKeyFromCellAndSide(
  cellId: string,
  side: SquareCellSide,
  columns: number,
  rows: number,
): string | null {
  const p = parseGridCellId(cellId);
  if (!p) return null;
  if (p.x < 0 || p.y < 0 || p.x >= columns || p.y >= rows) return null;
  const n = neighborSquareCellId(cellId, side, columns, rows);
  if (n) return makeUndirectedSquareEdgeKey(cellId, n);
  return makePerimeterSquareEdgeKey(cellId, side);
}

/**
 * True if `side` on `cellId` is an outer grid boundary (perimeter edge id).
 */
export function isPerimeterSideForCell(
  cellId: string,
  side: SquareCellSide,
  columns: number,
  rows: number,
): boolean {
  const p = parseGridCellId(cellId);
  if (!p) return false;
  if (p.x < 0 || p.y < 0 || p.x >= columns || p.y >= rows) return false;
  if (side === 'N' && p.y === 0) return true;
  if (side === 'S' && p.y === rows - 1) return true;
  if (side === 'W' && p.x === 0) return true;
  if (side === 'E' && p.x === columns - 1) return true;
  return false;
}

/**
 * True when `edgeId` is valid for a `columns` × `rows` square grid: interior
 * `between:` with both cells in-bounds and orthogonally adjacent, or `perimeter:`
 * with the cell in-bounds and the side still on the outer boundary (no neighbor).
 */
export function isSquareEdgeIdInBoundsForGrid(
  edgeId: string,
  columns: number,
  rows: number,
): boolean {
  const p = parseSquareEdgeId(edgeId.trim());
  if (!p) return false;
  if (p.kind === 'between') {
    const pa = parseGridCellId(p.cellA);
    const pb = parseGridCellId(p.cellB);
    if (!pa || !pb) return false;
    if (
      pa.x < 0 ||
      pa.y < 0 ||
      pa.x >= columns ||
      pa.y >= rows ||
      pb.x < 0 ||
      pb.y < 0 ||
      pb.x >= columns ||
      pb.y >= rows
    ) {
      return false;
    }
    const dx = Math.abs(pa.x - pb.x);
    const dy = Math.abs(pa.y - pb.y);
    return dx + dy === 1;
  }
  const c = parseGridCellId(p.cellId);
  if (!c || c.x < 0 || c.y < 0 || c.x >= columns || c.y >= rows) return false;
  return isPerimeterSideForCell(p.cellId, p.side, columns, rows);
}
