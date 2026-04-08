// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolvePlacedObjectCellAnchorOffsetPx } from '../placedObjectPlacementAnchorLayout';

describe('resolvePlacedObjectCellAnchorOffsetPx', () => {
  const cellPx = 50;
  const gapPx = 4;
  const half = (cellPx + gapPx) / 2;

  it('returns zero for cell_center', () => {
    expect(resolvePlacedObjectCellAnchorOffsetPx('cell_center', cellPx, gapPx)).toEqual({
      offsetXPx: 0,
      offsetYPx: 0,
    });
  });

  it('offsets to shared-edge midpoints (east/west/north/south)', () => {
    expect(resolvePlacedObjectCellAnchorOffsetPx('between_cells_e', cellPx, gapPx)).toEqual({
      offsetXPx: half,
      offsetYPx: 0,
    });
    expect(resolvePlacedObjectCellAnchorOffsetPx('between_cells_w', cellPx, gapPx)).toEqual({
      offsetXPx: -half,
      offsetYPx: 0,
    });
    expect(resolvePlacedObjectCellAnchorOffsetPx('between_cells_s', cellPx, gapPx)).toEqual({
      offsetXPx: 0,
      offsetYPx: half,
    });
    expect(resolvePlacedObjectCellAnchorOffsetPx('between_cells_n', cellPx, gapPx)).toEqual({
      offsetXPx: 0,
      offsetYPx: -half,
    });
  });
});
