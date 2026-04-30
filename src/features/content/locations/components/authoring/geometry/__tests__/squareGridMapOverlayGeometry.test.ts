// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';
import { SQUARE_GRID_GAP_PX } from '@/shared/domain/grid/squareGridOverlayGeometry';

import {
  resolveSquareCellIdFromGridLocalPx,
  squareCellCenterPx,
  squareSharedEdgeSegmentPx,
} from '../squareGridMapOverlayGeometry';

describe('squareGridMapOverlayGeometry', () => {
  const cellPx = 40;
  const gapPx = SQUARE_GRID_GAP_PX;
  const step = cellPx + gapPx;

  it('squareCellCenterPx places origin cell center at half cell', () => {
    expect(squareCellCenterPx('0,0', cellPx)).toEqual({ cx: 20, cy: 20 });
  });

  it('squareCellCenterPx steps by cell + gap', () => {
    expect(squareCellCenterPx('1,0', cellPx)?.cx).toBe(step + cellPx / 2);
  });

  it('resolveSquareCellIdFromGridLocalPx returns cell when point is inside cell rect', () => {
    expect(resolveSquareCellIdFromGridLocalPx(20, 20, cellPx, 3, 3, gapPx)).toBe('0,0');
    // Inside cell 1,0 — center ~ (61, 20) when step = 41
    expect(resolveSquareCellIdFromGridLocalPx(step + 20, 20, cellPx, 3, 3, gapPx)).toBe('1,0');
  });

  it('resolveSquareCellIdFromGridLocalPx returns null in the inter-cell gap', () => {
    // x = cellPx lands on gap after cell 0 (rx >= cellPx)
    expect(resolveSquareCellIdFromGridLocalPx(cellPx, 20, cellPx, 3, 3, gapPx)).toBeNull();
  });

  it('squareSharedEdgeSegmentPx draws vertical segment in gutter for east neighbor', () => {
    const a = '0,0';
    const b = '1,0';
    expect(makeUndirectedSquareEdgeKey(a, b)).toMatch(/^between:/);
    const seg = squareSharedEdgeSegmentPx(a, b, cellPx);
    expect(seg).not.toBeNull();
    expect(seg!.x1).toBe(seg!.x2);
    expect(seg!.y1).toBe(0);
    expect(seg!.y2).toBe(cellPx);
  });

  it('squareSharedEdgeSegmentPx draws horizontal segment for south neighbor', () => {
    const seg = squareSharedEdgeSegmentPx('0,0', '0,1', cellPx);
    expect(seg).not.toBeNull();
    expect(seg!.y1).toBe(seg!.y2);
    expect(seg!.x1).toBe(0);
    expect(seg!.x2).toBe(cellPx);
  });

  it('squareSharedEdgeSegmentPx returns null when not adjacent', () => {
    expect(squareSharedEdgeSegmentPx('0,0', '2,0', cellPx)).toBeNull();
  });
});
