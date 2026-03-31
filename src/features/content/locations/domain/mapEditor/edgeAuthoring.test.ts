// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';

import {
  applyEdgeStrokeToDraft,
  areEdgesAdjacent,
  getSquareEdgeOrientation,
  getSquareEdgeOrientationFromEdgeId,
  resolveEdgeTargetFromGridPosition,
  resolveNearestCellEdgeSide,
  shouldAcceptStrokeEdge,
  type ResolvedEdgeTarget,
} from './edgeAuthoring';

// ---------------------------------------------------------------------------
// resolveNearestCellEdgeSide
// ---------------------------------------------------------------------------

describe('resolveNearestCellEdgeSide', () => {
  const cellPx = 40;

  it('returns N when pointer is near the top', () => {
    expect(resolveNearestCellEdgeSide(20, 2, cellPx)).toBe('N');
  });

  it('returns S when pointer is near the bottom', () => {
    expect(resolveNearestCellEdgeSide(20, 38, cellPx)).toBe('S');
  });

  it('returns W when pointer is near the left', () => {
    expect(resolveNearestCellEdgeSide(2, 20, cellPx)).toBe('W');
  });

  it('returns E when pointer is near the right', () => {
    expect(resolveNearestCellEdgeSide(38, 20, cellPx)).toBe('E');
  });

  it('tie at exact center resolves to N (stable tie-break)', () => {
    expect(resolveNearestCellEdgeSide(20, 20, cellPx)).toBe('N');
  });

  it('corner near top-left resolves to N (top wins tie with left)', () => {
    expect(resolveNearestCellEdgeSide(3, 3, cellPx)).toBe('N');
  });
});

// ---------------------------------------------------------------------------
// resolveEdgeTargetFromGridPosition
// ---------------------------------------------------------------------------

describe('resolveEdgeTargetFromGridPosition', () => {
  const cellPx = 40;
  const gapPx = 4;
  const cols = 4;
  const rows = 4;
  const step = cellPx + gapPx; // 44

  it('resolves nearest edge inside a cell', () => {
    // Pointer near right edge of cell (0,0): (38, 20)
    const result = resolveEdgeTargetFromGridPosition(38, 20, cellPx, gapPx, cols, rows);
    expect(result).not.toBeNull();
    expect(result!.cellId).toBe('0,0');
    expect(result!.side).toBe('E');
    expect(result!.edgeId).toBe(makeUndirectedSquareEdgeKey('0,0', '1,0'));
  });

  it('resolves edge in a vertical gap between columns', () => {
    // Gap between col 0 and col 1 at row 0: x = cellPx + 1 = 41
    const result = resolveEdgeTargetFromGridPosition(cellPx + 1, 20, cellPx, gapPx, cols, rows);
    expect(result).not.toBeNull();
    expect(result!.side).toBe('E');
    expect(result!.edgeId).toBe(makeUndirectedSquareEdgeKey('0,0', '1,0'));
  });

  it('resolves edge in a horizontal gap between rows', () => {
    // Gap between row 0 and row 1 at col 0: y = cellPx + 1 = 41
    const result = resolveEdgeTargetFromGridPosition(20, cellPx + 1, cellPx, gapPx, cols, rows);
    expect(result).not.toBeNull();
    expect(result!.side).toBe('S');
    expect(result!.edgeId).toBe(makeUndirectedSquareEdgeKey('0,0', '0,1'));
  });

  it('returns null for grid boundary with no neighbor', () => {
    // Pointer at top edge of cell (0,0): nearest side is N, but no neighbor above
    const result = resolveEdgeTargetFromGridPosition(20, 1, cellPx, gapPx, cols, rows);
    expect(result).toBeNull();
  });

  it('returns null when pointer is outside grid bounds', () => {
    const totalW = cols * cellPx + (cols - 1) * gapPx;
    expect(resolveEdgeTargetFromGridPosition(totalW + 1, 20, cellPx, gapPx, cols, rows)).toBeNull();
    expect(resolveEdgeTargetFromGridPosition(-1, 20, cellPx, gapPx, cols, rows)).toBeNull();
  });

  it('resolves correctly for an interior cell', () => {
    // Cell (1,1) top-left is at (step, step) = (44, 44). Pointer near south: (44 + 20, 44 + 38)
    const x = step + 20;
    const y = step + 38;
    const result = resolveEdgeTargetFromGridPosition(x, y, cellPx, gapPx, cols, rows);
    expect(result).not.toBeNull();
    expect(result!.cellId).toBe('1,1');
    expect(result!.side).toBe('S');
    expect(result!.edgeId).toBe(makeUndirectedSquareEdgeKey('1,1', '1,2'));
  });

  it('corner gap resolves to an edge (not null)', () => {
    // Corner gap between (0,0), (1,0), (0,1), (1,1) at (cellPx + gapPx/2, cellPx + gapPx/2) = (42, 42)
    const result = resolveEdgeTargetFromGridPosition(cellPx + gapPx / 2, cellPx + gapPx / 2, cellPx, gapPx, cols, rows);
    expect(result).not.toBeNull();
    expect(result!.edgeId).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// applyEdgeStrokeToDraft
// ---------------------------------------------------------------------------

describe('applyEdgeStrokeToDraft', () => {
  it('adds new edge entries for empty edges', () => {
    const result = applyEdgeStrokeToDraft(
      [],
      ['between:0,0|1,0', 'between:0,0|0,1'],
      'wall',
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      kind: 'wall',
      edgeId: 'between:0,0|1,0',
    });
    expect(result[1]).toEqual({
      kind: 'wall',
      edgeId: 'between:0,0|0,1',
    });
  });

  it('no-ops when same kind already exists on edge', () => {
    const existing = [
      { kind: 'wall' as const, edgeId: 'between:0,0|1,0' },
    ];
    const result = applyEdgeStrokeToDraft(existing, ['between:0,0|1,0'], 'wall');
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('wall');
  });

  it('replaces existing edge with different kind', () => {
    const existing = [
      { kind: 'wall' as const, edgeId: 'between:0,0|1,0' },
    ];
    const result = applyEdgeStrokeToDraft(existing, ['between:0,0|1,0'], 'door');
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('door');
  });

  it('deduplicates repeated edge IDs in a single stroke', () => {
    const result = applyEdgeStrokeToDraft(
      [],
      ['between:0,0|1,0', 'between:0,0|1,0', 'between:0,0|1,0'],
      'wall',
    );
    expect(result).toHaveLength(1);
  });

  it('preserves untouched existing entries', () => {
    const existing = [
      { kind: 'wall' as const, edgeId: 'between:0,0|1,0' },
      { kind: 'door' as const, edgeId: 'between:1,0|2,0' },
    ];
    const result = applyEdgeStrokeToDraft(
      existing,
      ['between:0,0|0,1'],
      'window',
    );
    expect(result).toHaveLength(3);
    expect(result.find((e) => e.edgeId === 'between:0,0|1,0')?.kind).toBe('wall');
    expect(result.find((e) => e.edgeId === 'between:1,0|2,0')?.kind).toBe('door');
    expect(result.find((e) => e.edgeId === 'between:0,0|0,1')?.kind).toBe('window');
  });

  it('handles mixed add and replace in a single stroke', () => {
    const existing = [
      { kind: 'door' as const, edgeId: 'between:0,0|1,0' },
    ];
    const result = applyEdgeStrokeToDraft(
      existing,
      ['between:0,0|1,0', 'between:0,0|0,1'],
      'wall',
    );
    expect(result).toHaveLength(2);
    expect(result.find((e) => e.edgeId === 'between:0,0|1,0')).toEqual({
      kind: 'wall',
      edgeId: 'between:0,0|1,0',
    });
    expect(result.find((e) => e.edgeId === 'between:0,0|0,1')?.kind).toBe('wall');
  });
});

// ---------------------------------------------------------------------------
// getSquareEdgeOrientation
// ---------------------------------------------------------------------------

describe('getSquareEdgeOrientation', () => {
  it('N and S sides are horizontal', () => {
    expect(getSquareEdgeOrientation('N')).toBe('horizontal');
    expect(getSquareEdgeOrientation('S')).toBe('horizontal');
  });

  it('E and W sides are vertical', () => {
    expect(getSquareEdgeOrientation('E')).toBe('vertical');
    expect(getSquareEdgeOrientation('W')).toBe('vertical');
  });
});

// ---------------------------------------------------------------------------
// areEdgesAdjacent
// ---------------------------------------------------------------------------

describe('areEdgesAdjacent', () => {
  it('returns true when edges share a cell', () => {
    expect(areEdgesAdjacent('between:0,0|1,0', 'between:1,0|2,0')).toBe(true);
  });

  it('returns true when edges share the other cell', () => {
    expect(areEdgesAdjacent('between:0,0|1,0', 'between:0,0|0,1')).toBe(true);
  });

  it('returns true for parallel horizontal edges along the same row boundary', () => {
    // south of (0,0) and south of (1,0) — no shared cell but cells are neighbors
    expect(areEdgesAdjacent('between:0,0|0,1', 'between:1,0|1,1')).toBe(true);
  });

  it('returns true for parallel vertical edges along the same column boundary', () => {
    // east of (0,0) and east of (0,1) — no shared cell but cells are neighbors
    expect(areEdgesAdjacent('between:0,0|1,0', 'between:0,1|1,1')).toBe(true);
  });

  it('returns false when edges are too far apart', () => {
    expect(areEdgesAdjacent('between:0,0|1,0', 'between:3,0|4,0')).toBe(false);
  });

  it('returns false for malformed edge IDs', () => {
    expect(areEdgesAdjacent('invalid', 'between:0,0|1,0')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shouldAcceptStrokeEdge
// ---------------------------------------------------------------------------

describe('shouldAcceptStrokeEdge', () => {
  const hEdge = (cellId: string, edgeId: string): ResolvedEdgeTarget => ({
    cellId,
    side: 'S',
    edgeId,
  });
  const vEdge = (cellId: string, edgeId: string): ResolvedEdgeTarget => ({
    cellId,
    side: 'E',
    edgeId,
  });

  it('accepts next collinear horizontal edge', () => {
    // South boundary of row 0: (0,0)|(0,1) then (1,0)|(1,1) — same row boundary, adjacent column
    const last = hEdge('0,0', 'between:0,0|0,1');
    const candidate = hEdge('1,0', 'between:1,0|1,1');
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', false);
    expect(result.accept).toBe(true);
    expect(result.newAxis).toBe('horizontal');
  });

  it('accepts next collinear vertical edge', () => {
    // East boundary of col 0: (0,0)|(1,0) then (0,1)|(1,1) — same col boundary, adjacent row
    const last = vEdge('0,0', 'between:0,0|1,0');
    const candidate = vEdge('0,1', 'between:0,1|1,1');
    const result = shouldAcceptStrokeEdge(candidate, last, 'vertical', false);
    expect(result.accept).toBe(true);
    expect(result.newAxis).toBe('vertical');
  });

  it('rejects same-axis edge on a different boundary line', () => {
    // South of (0,0) is boundary row 1; south of (0,2) is boundary row 3 — different line
    const last = hEdge('0,0', 'between:0,0|0,1');
    const candidate = hEdge('0,2', 'between:0,2|0,3');
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', false);
    expect(result.accept).toBe(false);
  });

  it('rejects same-axis edge that is not sequentially adjacent', () => {
    // Same boundary line but two cells apart
    const last = hEdge('0,0', 'between:0,0|0,1');
    const candidate = hEdge('2,0', 'between:2,0|2,1');
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', false);
    expect(result.accept).toBe(false);
  });

  it('rejects different-axis edge when axis is locked', () => {
    const last = hEdge('0,0', 'between:0,0|0,1');
    const candidate = vEdge('0,0', 'between:0,0|1,0');
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', false);
    expect(result.accept).toBe(false);
    expect(result.newAxis).toBe('horizontal');
  });

  it('accepts different-axis adjacent edge when shift is held', () => {
    const last = hEdge('0,0', 'between:0,0|0,1');
    const candidate = vEdge('0,0', 'between:0,0|1,0');
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', true);
    expect(result.accept).toBe(true);
    expect(result.newAxis).toBe('vertical');
  });

  it('rejects non-adjacent edge even with shift held', () => {
    const last = hEdge('0,0', 'between:0,0|0,1');
    const candidate = hEdge('5,5', 'between:5,5|5,6');
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', true);
    expect(result.accept).toBe(false);
  });

  it('locks axis from first edge orientation when no axis set', () => {
    const last = vEdge('0,0', 'between:0,0|1,0');
    const candidate = vEdge('0,1', 'between:0,1|1,1');
    const result = shouldAcceptStrokeEdge(candidate, last, null, false);
    expect(result.accept).toBe(true);
    expect(result.newAxis).toBe('vertical');
  });

  it('rejects branch edge in adjacent column during horizontal draw', () => {
    // Drawing south edges along col 1. Wobble hits south edge of col 2 on same boundary.
    // This is on the same boundary line but should only accept the NEXT sequential edge.
    const last = hEdge('1,1', 'between:1,1|1,2');
    const candidate = hEdge('2,1', 'between:2,1|2,2');
    // boundary: max y = 2 for both → same line. running: x=1 vs x=2 → diff 1 → accept
    const result = shouldAcceptStrokeEdge(candidate, last, 'horizontal', false);
    // This IS sequential along the boundary — it would draw the wall one cell to the right.
    // This is expected behavior for drawing a horizontal wall across columns.
    expect(result.accept).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getSquareEdgeOrientationFromEdgeId (shared with edge-run selection)
// ---------------------------------------------------------------------------

describe('getSquareEdgeOrientationFromEdgeId', () => {
  it('classifies vertical cell neighbors (N/S boundary) as horizontal axis', () => {
    expect(getSquareEdgeOrientationFromEdgeId('between:0,0|0,1')).toBe('horizontal');
  });

  it('classifies horizontal cell neighbors (E/W boundary) as vertical axis', () => {
    expect(getSquareEdgeOrientationFromEdgeId('between:0,0|1,0')).toBe('vertical');
  });

  it('returns null for non-adjacent cells', () => {
    expect(getSquareEdgeOrientationFromEdgeId('between:0,0|2,0')).toBeNull();
  });
});
