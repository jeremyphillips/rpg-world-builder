// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  isCellInBounds,
  listGridPoints,
  getNeighborPoints,
  getNeighborCellIds,
  getGridDistance,
} from '../gridHelpers';
import { makeGridCellId } from '../gridCellIds';
import type { GridDefinition } from '../gridDefinition';
import type { GridPoint } from '../gridCellIds';

const sq3x3: GridDefinition = { geometry: 'square', columns: 3, rows: 3 };
const hex4x4: GridDefinition = { geometry: 'hex', columns: 4, rows: 4 };

// ---------------------------------------------------------------------------
// isCellInBounds
// ---------------------------------------------------------------------------

describe('isCellInBounds', () => {
  it.each<[string, GridDefinition, GridPoint, boolean]>([
    ['square origin', sq3x3, { x: 0, y: 0 }, true],
    ['square max corner', sq3x3, { x: 2, y: 2 }, true],
    ['square negative x', sq3x3, { x: -1, y: 0 }, false],
    ['square out of cols', sq3x3, { x: 3, y: 0 }, false],
    ['square out of rows', sq3x3, { x: 0, y: 3 }, false],
    ['hex origin', hex4x4, { x: 0, y: 0 }, true],
    ['hex max corner', hex4x4, { x: 3, y: 3 }, true],
    ['hex negative y', hex4x4, { x: 0, y: -1 }, false],
    ['hex out of cols', hex4x4, { x: 4, y: 0 }, false],
  ])('%s → %s', (_label, grid, point, expected) => {
    expect(isCellInBounds(grid, point)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// listGridPoints
// ---------------------------------------------------------------------------

describe('listGridPoints', () => {
  it('returns columns*rows points in row-major order (square)', () => {
    const pts = listGridPoints(sq3x3);
    expect(pts).toHaveLength(9);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[1]).toEqual({ x: 1, y: 0 });
    expect(pts[3]).toEqual({ x: 0, y: 1 });
    expect(pts[8]).toEqual({ x: 2, y: 2 });
  });

  it('returns columns*rows points for hex (same enumeration)', () => {
    const pts = listGridPoints(hex4x4);
    expect(pts).toHaveLength(16);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[15]).toEqual({ x: 3, y: 3 });
  });

  it('handles 1x1 grid', () => {
    expect(listGridPoints({ geometry: 'square', columns: 1, rows: 1 })).toEqual([{ x: 0, y: 0 }]);
  });

  it('handles 0-dimension grid', () => {
    expect(listGridPoints({ geometry: 'square', columns: 0, rows: 5 })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getNeighborPoints — square
// ---------------------------------------------------------------------------

describe('getNeighborPoints (square)', () => {
  it('center cell has 4 neighbors', () => {
    const n = getNeighborPoints(sq3x3, { x: 1, y: 1 });
    expect(n).toHaveLength(4);
    expect(n).toContainEqual({ x: 1, y: 0 }); // N
    expect(n).toContainEqual({ x: 2, y: 1 }); // E
    expect(n).toContainEqual({ x: 1, y: 2 }); // S
    expect(n).toContainEqual({ x: 0, y: 1 }); // W
  });

  it('corner cell has 2 neighbors', () => {
    const n = getNeighborPoints(sq3x3, { x: 0, y: 0 });
    expect(n).toHaveLength(2);
    expect(n).toContainEqual({ x: 1, y: 0 });
    expect(n).toContainEqual({ x: 0, y: 1 });
  });

  it('edge cell has 3 neighbors', () => {
    const n = getNeighborPoints(sq3x3, { x: 1, y: 0 });
    expect(n).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// getNeighborPoints — hex (odd-q offset)
// ---------------------------------------------------------------------------

describe('getNeighborPoints (hex, odd-q offset)', () => {
  it('even-column center has 6 neighbors', () => {
    const n = getNeighborPoints(hex4x4, { x: 2, y: 2 });
    expect(n).toHaveLength(6);
    // Even col (x=2): offsets are [+1,-1],[+1,0],[0,+1],[-1,0],[-1,-1],[0,-1]
    expect(n).toContainEqual({ x: 3, y: 1 }); // NE
    expect(n).toContainEqual({ x: 3, y: 2 }); // SE
    expect(n).toContainEqual({ x: 2, y: 3 }); // S
    expect(n).toContainEqual({ x: 1, y: 2 }); // SW
    expect(n).toContainEqual({ x: 1, y: 1 }); // NW
    expect(n).toContainEqual({ x: 2, y: 1 }); // N
  });

  it('odd-column center has 6 neighbors', () => {
    const n = getNeighborPoints(hex4x4, { x: 1, y: 1 });
    expect(n).toHaveLength(6);
    // Odd col (x=1): offsets are [+1,0],[+1,+1],[0,+1],[-1,+1],[-1,0],[0,-1]
    expect(n).toContainEqual({ x: 2, y: 1 }); // NE
    expect(n).toContainEqual({ x: 2, y: 2 }); // SE
    expect(n).toContainEqual({ x: 1, y: 2 }); // S
    expect(n).toContainEqual({ x: 0, y: 2 }); // SW
    expect(n).toContainEqual({ x: 0, y: 1 }); // NW
    expect(n).toContainEqual({ x: 1, y: 0 }); // N
  });

  it('hex corner (0,0 even col) clips to in-bounds only', () => {
    const n = getNeighborPoints(hex4x4, { x: 0, y: 0 });
    // Even col offsets from (0,0): (1,-1)OOB, (1,0)ok, (0,1)ok, (-1,0)OOB, (-1,-1)OOB, (0,-1)OOB
    expect(n).toHaveLength(2);
    expect(n).toContainEqual({ x: 1, y: 0 });
    expect(n).toContainEqual({ x: 0, y: 1 });
  });

  it('hex top-row odd col clips north neighbors', () => {
    const n = getNeighborPoints(hex4x4, { x: 1, y: 0 });
    // Odd col offsets from (1,0): (2,0)ok, (2,1)ok, (1,1)ok, (0,1)ok, (0,0)ok, (1,-1)OOB
    expect(n).toHaveLength(5);
    expect(n).not.toContainEqual({ x: 1, y: -1 });
  });
});

// ---------------------------------------------------------------------------
// getNeighborCellIds
// ---------------------------------------------------------------------------

describe('getNeighborCellIds', () => {
  it('returns cell-id strings matching getNeighborPoints', () => {
    const ids = getNeighborCellIds(sq3x3, '1,1');
    expect(ids).not.toBeNull();
    expect(ids).toHaveLength(4);
    expect(ids).toContain(makeGridCellId(1, 0));
    expect(ids).toContain(makeGridCellId(2, 1));
    expect(ids).toContain(makeGridCellId(1, 2));
    expect(ids).toContain(makeGridCellId(0, 1));
  });

  it('returns null for unparseable cell id', () => {
    expect(getNeighborCellIds(sq3x3, 'bad')).toBeNull();
  });

  it('works for hex geometry', () => {
    const ids = getNeighborCellIds(hex4x4, '2,2');
    expect(ids).not.toBeNull();
    expect(ids).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// getGridDistance — square (Chebyshev)
// ---------------------------------------------------------------------------

describe('getGridDistance (square)', () => {
  it('same cell → 0', () => {
    expect(getGridDistance(sq3x3, { x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it('adjacent orthogonal → 1', () => {
    expect(getGridDistance(sq3x3, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(1);
  });

  it('diagonal → max(dx, dy)', () => {
    expect(getGridDistance(sq3x3, { x: 0, y: 0 }, { x: 2, y: 2 })).toBe(2);
  });

  it('non-diagonal → max(dx, dy)', () => {
    expect(getGridDistance(sq3x3, { x: 0, y: 0 }, { x: 2, y: 1 })).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getGridDistance — hex (axial distance via odd-q offset conversion)
// ---------------------------------------------------------------------------

describe('getGridDistance (hex)', () => {
  it('same cell → 0', () => {
    expect(getGridDistance(hex4x4, { x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it('adjacent hex → 1', () => {
    // (0,0) and (1,0) are neighbors in any hex layout
    expect(getGridDistance(hex4x4, { x: 0, y: 0 }, { x: 1, y: 0 })).toBe(1);
  });

  it('two steps away', () => {
    // (0,0) → (2,0): even col 0 to even col 2 same row = 2 hex steps
    expect(getGridDistance(hex4x4, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(2);
  });

  it('diagonal hex path', () => {
    // (0,0) → (1,1): axial (0,0)→(1,1) => dq=1,dr=1,ds=-2 => max=2
    // BUT with odd-q: (0,0)→axial(0,0), (1,1)→axial(1, 1-0)=(1,1)
    // dq=1, dr=1, ds=-(1+1)=-2 => max(1,1,2) = 2
    expect(getGridDistance(hex4x4, { x: 0, y: 0 }, { x: 1, y: 1 })).toBe(2);
  });

  it('straight south is row distance for even column', () => {
    // (0,0) → (0,3): axial (0,0) and (0,3) => dq=0, dr=3, ds=-3 => 3
    expect(getGridDistance(hex4x4, { x: 0, y: 0 }, { x: 0, y: 3 })).toBe(3);
  });
});
