/**
 * Geometry-aware grid helper functions.
 *
 * All public helpers accept a {@link GridDefinition} and branch on `geometry`
 * so callers get correct behavior for both square and hex grids without
 * managing coordinate systems themselves.
 *
 * **Square** uses the established bounded x/y model (origin top-left, x right,
 * y down). Neighbor adjacency is 4-directional (N/S/E/W); distance is
 * Chebyshev (max of dx, dy) to align with existing encounter conventions.
 *
 * **Hex** uses an odd-q offset model inside the same bounded column/row space.
 * Odd-numbered columns are shifted down by half a row. Internally, offset
 * coordinates are converted to axial (q, r) when needed for distance and
 * neighbor calculations. The public API surface remains {@link GridPoint}-based
 * (`{ x, y }`) — axial types are not exposed.
 *
 * Advanced hex rendering, editor integration, and encounter mechanics are
 * intentionally deferred; this module covers shared grid-domain math only.
 */

import type { GridDefinition } from './gridDefinition';
import type { GridPoint } from './gridCellIds';
import { makeGridCellId, parseGridCellId } from './gridCellIds';

// ---------------------------------------------------------------------------
// Internal hex math (odd-q offset ↔ axial)
// ---------------------------------------------------------------------------

type AxialPoint = { q: number; r: number };

function offsetToAxial(p: GridPoint): AxialPoint {
  return { q: p.x, r: p.y - Math.floor(p.x / 2) };
}

function axialDistance(a: AxialPoint, b: AxialPoint): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -(dq + dr);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

// ---------------------------------------------------------------------------
// Hex neighbor offset tables (odd-q)
// ---------------------------------------------------------------------------

const HEX_NEIGHBORS_EVEN_COL: readonly [number, number][] = [
  [+1, -1], // NE
  [+1, 0],  // SE
  [0, +1],  // S
  [-1, 0],  // SW
  [-1, -1], // NW
  [0, -1],  // N
];

const HEX_NEIGHBORS_ODD_COL: readonly [number, number][] = [
  [+1, 0],  // NE
  [+1, +1], // SE
  [0, +1],  // S
  [-1, +1], // SW
  [-1, 0],  // NW
  [0, -1],  // N
];

const SQUARE_NEIGHBORS: readonly [number, number][] = [
  [0, -1],  // N
  [+1, 0],  // E
  [0, +1],  // S
  [-1, 0],  // W
];

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** True when `point` falls within the bounded column/row space of `grid`. */
export function isCellInBounds(grid: GridDefinition, point: GridPoint): boolean {
  return point.x >= 0 && point.y >= 0 && point.x < grid.columns && point.y < grid.rows;
}

/**
 * Enumerates every {@link GridPoint} in the grid, row-major order
 * (x increments first within each row).
 */
export function listGridPoints(grid: GridDefinition): GridPoint[] {
  const points: GridPoint[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.columns; x++) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Returns in-bounds neighbor points for `point` under the grid's geometry.
 *
 * - **square**: 4 neighbors (N, E, S, W).
 * - **hex**: 6 neighbors using the odd-q offset table.
 */
export function getNeighborPoints(grid: GridDefinition, point: GridPoint): GridPoint[] {
  const offsets =
    grid.geometry === 'hex'
      ? point.x % 2 === 0
        ? HEX_NEIGHBORS_EVEN_COL
        : HEX_NEIGHBORS_ODD_COL
      : SQUARE_NEIGHBORS;

  const neighbors: GridPoint[] = [];
  for (const [dx, dy] of offsets) {
    const n: GridPoint = { x: point.x + dx, y: point.y + dy };
    if (isCellInBounds(grid, n)) {
      neighbors.push(n);
    }
  }
  return neighbors;
}

/**
 * Cell-id-string variant of {@link getNeighborPoints}.
 * Returns `null` if `cellId` cannot be parsed.
 */
export function getNeighborCellIds(grid: GridDefinition, cellId: string): string[] | null {
  const point = parseGridCellId(cellId);
  if (!point) return null;
  return getNeighborPoints(grid, point).map((p) => makeGridCellId(p.x, p.y));
}

/**
 * Grid distance between two points under the grid's geometry.
 *
 * - **square**: Chebyshev distance (`max(|dx|, |dy|)`).
 * - **hex**: axial distance (offset → axial conversion, then cube/axial formula).
 */
export function getGridDistance(grid: GridDefinition, a: GridPoint, b: GridPoint): number {
  if (grid.geometry === 'hex') {
    return axialDistance(offsetToAxial(a), offsetToAxial(b));
  }
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
