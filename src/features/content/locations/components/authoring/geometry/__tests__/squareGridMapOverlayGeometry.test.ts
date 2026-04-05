// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';

import {
  resolveSquareCellIdFromGridLocalPx,
  squareCellCenterPx,
  squareSharedEdgeSegmentPx,
} from '../squareGridMapOverlayGeometry';

describe('squareGridMapOverlayGeometry', () => {
  const cellPx = 40;

  it('squareCellCenterPx places origin cell center at half cell', () => {
    expect(squareCellCenterPx('0,0', cellPx)).toEqual({ cx: 20, cy: 20 });
  });

  it('squareCellCenterPx steps by cell + gap', () => {
    expect(squareCellCenterPx('1,0', cellPx)?.cx).toBe(40 + 4 + 20);
  });

  it('resolveSquareCellIdFromGridLocalPx returns cell when point is inside cell rect', () => {
    expect(resolveSquareCellIdFromGridLocalPx(20, 20, cellPx, 3, 3)).toBe('0,0');
    expect(resolveSquareCellIdFromGridLocalPx(64, 20, cellPx, 3, 3)).toBe('1,0');
  });

  it('resolveSquareCellIdFromGridLocalPx returns null in the inter-cell gap', () => {
    expect(resolveSquareCellIdFromGridLocalPx(42, 20, cellPx, 3, 3)).toBeNull();
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
