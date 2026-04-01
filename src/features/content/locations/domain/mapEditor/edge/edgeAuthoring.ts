/**
 * Pure helpers for edge-boundary authoring on square grids.
 *
 * Edges (walls, windows, doors) live on shared cell boundaries, not through
 * cell centers. This module provides:
 * - pointer-to-edge resolution (which boundary is nearest?)
 * - stroke application with replace/no-op rules
 */
import { makeGridCellId, parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import {
  edgeKeyFromCellAndSide,
  type SquareCellSide,
} from '@/shared/domain/grid/gridEdgeIds';
import type { LocationMapEdgeAuthoringEntry } from '@/shared/domain/locations';
import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';

const BETWEEN_RE = /^between:([^|]+)\|([^|]+)$/;

export type ResolvedEdgeTarget = {
  cellId: string;
  side: SquareCellSide;
  edgeId: string;
};

/**
 * Given a pointer offset within a cell (0,0 = top-left corner), returns the
 * nearest side. Tie-break priority: N > E > S > W (stable).
 */
export function resolveNearestCellEdgeSide(
  offsetX: number,
  offsetY: number,
  cellPx: number,
): SquareCellSide {
  const dTop = offsetY;
  const dBottom = cellPx - offsetY;
  const dLeft = offsetX;
  const dRight = cellPx - offsetX;

  const min = Math.min(dTop, dRight, dBottom, dLeft);
  if (min === dTop) return 'N';
  if (min === dRight) return 'E';
  if (min === dBottom) return 'S';
  return 'W';
}

/**
 * From a pointer position relative to the grid container origin, resolves the
 * canonical edge target (cell boundary) that the pointer is nearest to.
 *
 * Handles three zones:
 * - **In-cell**: pointer inside a cell rectangle; delegates to nearest side.
 * - **In gap**: pointer in the gutter between cells; directly identifies the shared edge.
 * - **Out of bounds / grid border with no neighbor**: returns `null`.
 */
export function resolveEdgeTargetFromGridPosition(
  gridX: number,
  gridY: number,
  cellPx: number,
  gapPx: number,
  cols: number,
  rows: number,
): ResolvedEdgeTarget | null {
  if (gridX < 0 || gridY < 0 || cols <= 0 || rows <= 0) return null;

  const step = cellPx + gapPx;
  const totalW = cols * cellPx + Math.max(0, cols - 1) * gapPx;
  const totalH = rows * cellPx + Math.max(0, rows - 1) * gapPx;
  if (gridX >= totalW || gridY >= totalH) return null;

  const col = Math.floor(gridX / step);
  const row = Math.floor(gridY / step);

  const localX = gridX - col * step;
  const localY = gridY - row * step;

  const inCellX = localX < cellPx;
  const inCellY = localY < cellPx;

  if (inCellX && inCellY) {
    const cellId = makeGridCellId(col, row);
    const side = resolveNearestCellEdgeSide(localX, localY, cellPx);
    const edgeId = edgeKeyFromCellAndSide(cellId, side, cols, rows);
    if (!edgeId) return null;
    return { cellId, side, edgeId };
  }

  if (!inCellX && inCellY) {
    // Vertical gap between columns
    const rightCol = col + 1;
    if (rightCol >= cols) return null;
    const cellId = makeGridCellId(col, row);
    const edgeId = edgeKeyFromCellAndSide(cellId, 'E', cols, rows);
    if (!edgeId) return null;
    return { cellId, side: 'E', edgeId };
  }

  if (inCellX && !inCellY) {
    // Horizontal gap between rows
    const bottomRow = row + 1;
    if (bottomRow >= rows) return null;
    const cellId = makeGridCellId(col, row);
    const edgeId = edgeKeyFromCellAndSide(cellId, 'S', cols, rows);
    if (!edgeId) return null;
    return { cellId, side: 'S', edgeId };
  }

  // Corner gap: pick nearest of the four surrounding edges.
  const gapCenterX = col * step + cellPx + gapPx / 2;
  const gapCenterY = row * step + cellPx + gapPx / 2;
  const rightCol = col + 1;
  const bottomRow = row + 1;

  // Prefer horizontal (south/north) vs vertical (east/west) based on which
  // gap axis the pointer is closer to center on.
  const dxFromCenter = Math.abs(gridX - gapCenterX);
  const dyFromCenter = Math.abs(gridY - gapCenterY);

  if (dyFromCenter <= dxFromCenter) {
    // Closer to the horizontal gap line -> south edge of top row or north edge of bottom row
    if (gridX <= gapCenterX && col < cols) {
      const cellId = makeGridCellId(col, row);
      const edgeId = edgeKeyFromCellAndSide(cellId, 'S', cols, rows);
      if (edgeId) return { cellId, side: 'S', edgeId };
    }
    if (rightCol < cols) {
      const cellId = makeGridCellId(rightCol, row);
      const edgeId = edgeKeyFromCellAndSide(cellId, 'S', cols, rows);
      if (edgeId) return { cellId, side: 'S', edgeId };
    }
  } else {
    // Closer to the vertical gap line -> east edge of left col or west edge of right col
    if (gridY <= gapCenterY && row < rows) {
      const cellId = makeGridCellId(col, row);
      const edgeId = edgeKeyFromCellAndSide(cellId, 'E', cols, rows);
      if (edgeId) return { cellId, side: 'E', edgeId };
    }
    if (bottomRow < rows) {
      const cellId = makeGridCellId(col, bottomRow);
      const edgeId = edgeKeyFromCellAndSide(cellId, 'E', cols, rows);
      if (edgeId) return { cellId, side: 'E', edgeId };
    }
  }

  return null;
}

/**
 * Apply a set of edge IDs to the draft edge entries array.
 *
 * Rules:
 * - Same kind already on edge -> no-op (skip)
 * - Different kind on edge -> replace in place
 * - Empty edge -> add `{ edgeId, kind }`
 */
export function applyEdgeStrokeToDraft(
  existingFeatures: readonly LocationMapEdgeAuthoringEntry[],
  strokeEdgeIds: readonly string[],
  edgeKind: LocationEdgeFeatureKindId,
): LocationMapEdgeAuthoringEntry[] {
  const byEdgeId = new Map<string, LocationMapEdgeAuthoringEntry>();
  for (const f of existingFeatures) {
    byEdgeId.set(f.edgeId, f);
  }

  const strokeSet = new Set(strokeEdgeIds);

  for (const edgeId of strokeSet) {
    const existing = byEdgeId.get(edgeId);
    if (existing) {
      if (existing.kind === edgeKind) continue;
      byEdgeId.set(edgeId, { edgeId, kind: edgeKind });
    } else {
      byEdgeId.set(edgeId, { edgeId, kind: edgeKind });
    }
  }

  return Array.from(byEdgeId.values());
}

// ---------------------------------------------------------------------------
// Stroke constraint helpers (axis lock + adjacency)
// ---------------------------------------------------------------------------

/**
 * Edge orientation for axis-lock purposes. Square grids have two; hex grids
 * would add three more (extend this union when hex edge authoring lands).
 */
export type EdgeOrientation = 'horizontal' | 'vertical';

/** N/S sides produce horizontal edge segments; E/W produce vertical ones. */
export function getSquareEdgeOrientation(side: SquareCellSide): EdgeOrientation {
  return side === 'N' || side === 'S' ? 'horizontal' : 'vertical';
}

/**
 * Parse the two cell IDs from a canonical `between:cellA|cellB` edge ID.
 */
export function parseSquareEdgeCells(edgeId: string): [string, string] | null {
  const m = BETWEEN_RE.exec(edgeId);
  if (!m) return null;
  return [m[1].trim(), m[2].trim()];
}

/**
 * Orientation of the boundary segment for a square edge id (same model as stroke authoring).
 * Vertical cell neighbors (N/S) → horizontal segment; horizontal neighbors (E/W) → vertical segment.
 */
export function getSquareEdgeOrientationFromEdgeId(edgeId: string): EdgeOrientation | null {
  const cells = parseSquareEdgeCells(edgeId);
  if (!cells) return null;
  const [a, b] = cells;
  const pa = parseGridCellId(a);
  const pb = parseGridCellId(b);
  if (!pa || !pb) return null;
  const dx = Math.abs(pa.x - pb.x);
  const dy = Math.abs(pa.y - pb.y);
  if (dx + dy !== 1) return null;
  if (dx === 0 && dy === 1) return 'horizontal';
  if (dx === 1 && dy === 0) return 'vertical';
  return null;
}

/**
 * Two cell IDs are orthogonal neighbors if their Manhattan distance is exactly 1.
 */
function cellsAreNeighbors(a: string, b: string): boolean {
  const pa = a.split(',');
  const pb = b.split(',');
  if (pa.length !== 2 || pb.length !== 2) return false;
  const dx = Math.abs(Number(pa[0]) - Number(pb[0]));
  const dy = Math.abs(Number(pa[1]) - Number(pb[1]));
  return dx + dy === 1;
}

/**
 * Two edges are stroke-adjacent if they could form a continuous wall line.
 * This means they either share a cell, or at least one cell from each edge
 * is an orthogonal neighbor of a cell from the other (handles parallel edges
 * along the same boundary that meet at a corner point).
 */
export function areEdgesAdjacent(edgeIdA: string, edgeIdB: string): boolean {
  const a = parseSquareEdgeCells(edgeIdA);
  const b = parseSquareEdgeCells(edgeIdB);
  if (!a || !b) return false;
  for (const ca of a) {
    for (const cb of b) {
      if (ca === cb || cellsAreNeighbors(ca, cb)) return true;
    }
  }
  return false;
}

/**
 * Extract the boundary-line index for an edge. Horizontal edges (N/S) share
 * a row boundary (the max y of the two cells); vertical edges (E/W) share a
 * column boundary (the max x). Returns null if the edge can't be parsed.
 */
export function squareEdgeBoundaryIndex(edgeId: string, orientation: EdgeOrientation): number | null {
  const cells = parseSquareEdgeCells(edgeId);
  if (!cells) return null;
  const [a, b] = cells;
  const pa = a.split(',').map(Number);
  const pb = b.split(',').map(Number);
  if (pa.length !== 2 || pb.length !== 2) return null;
  if (orientation === 'horizontal') {
    return Math.max(pa[1], pb[1]);
  }
  return Math.max(pa[0], pb[0]);
}

/**
 * The "running index" along the boundary line — for horizontal edges this is
 * the x (column) of the leftmost cell; for vertical it's the y (row) of the
 * topmost cell. Used to verify the candidate is the next segment in line.
 */
export function squareEdgeRunningIndex(edgeId: string, orientation: EdgeOrientation): number | null {
  const cells = parseSquareEdgeCells(edgeId);
  if (!cells) return null;
  const [a, b] = cells;
  const pa = a.split(',').map(Number);
  const pb = b.split(',').map(Number);
  if (pa.length !== 2 || pb.length !== 2) return null;
  if (orientation === 'horizontal') {
    return Math.min(pa[0], pb[0]);
  }
  return Math.min(pa[1], pb[1]);
}

/**
 * Decide whether a candidate edge should be added to the current stroke.
 *
 * Returns `{ accept, newAxis }` where `newAxis` is the (possibly updated)
 * locked axis to store for subsequent edges.
 */
export function shouldAcceptStrokeEdge(
  candidate: ResolvedEdgeTarget,
  lastTarget: ResolvedEdgeTarget,
  lockedAxis: EdgeOrientation | null,
  shiftHeld: boolean,
): { accept: boolean; newAxis: EdgeOrientation | null } {
  const candidateAxis = getSquareEdgeOrientation(candidate.side);

  if (shiftHeld) {
    if (!areEdgesAdjacent(candidate.edgeId, lastTarget.edgeId)) {
      return { accept: false, newAxis: lockedAxis };
    }
    return { accept: true, newAxis: candidateAxis };
  }

  const effectiveAxis = lockedAxis ?? candidateAxis;

  if (candidateAxis !== effectiveAxis) {
    return { accept: false, newAxis: effectiveAxis };
  }

  // Same axis — require collinear (same boundary line) and sequential
  const lastBoundary = squareEdgeBoundaryIndex(lastTarget.edgeId, effectiveAxis);
  const candBoundary = squareEdgeBoundaryIndex(candidate.edgeId, effectiveAxis);
  if (lastBoundary == null || candBoundary == null || lastBoundary !== candBoundary) {
    return { accept: false, newAxis: effectiveAxis };
  }

  const lastRun = squareEdgeRunningIndex(lastTarget.edgeId, effectiveAxis);
  const candRun = squareEdgeRunningIndex(candidate.edgeId, effectiveAxis);
  if (lastRun == null || candRun == null || Math.abs(lastRun - candRun) !== 1) {
    return { accept: false, newAxis: effectiveAxis };
  }

  return { accept: true, newAxis: effectiveAxis };
}
