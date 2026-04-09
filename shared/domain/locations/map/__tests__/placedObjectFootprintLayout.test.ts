// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  computePlacedObjectFootprintMaxExtentPx,
  resolvePlacedObjectFootprintLayoutPx,
} from '../placedObjectFootprintLayout';

describe('computePlacedObjectFootprintMaxExtentPx', () => {
  const cellPx = 50;
  const feetPerCell = 5;

  it('uses one cell for major axis ≤ one cell in feet', () => {
    expect(
      computePlacedObjectFootprintMaxExtentPx({
        footprint: { kind: 'rect', widthFt: 5, depthFt: 3 },
        feetPerCell,
        cellPx,
      }),
    ).toBe(50);
  });

  it('uses two cells when major axis spans two cells', () => {
    expect(
      computePlacedObjectFootprintMaxExtentPx({
        footprint: { kind: 'rect', widthFt: 10, depthFt: 4 },
        feetPerCell,
        cellPx,
      }),
    ).toBe(100);
  });
});

describe('resolvePlacedObjectFootprintLayoutPx', () => {
  const cellPx = 50;
  const feetPerCell = 5;

  it('maps a 5x3 ft rect to pixel width/height on a 5ft cell', () => {
    const r = resolvePlacedObjectFootprintLayoutPx({
      footprint: { kind: 'rect', widthFt: 5, depthFt: 3 },
      feetPerCell,
      cellPx,
      maxExtentPx: cellPx,
    });
    expect(r.widthPx).toBeCloseTo(50);
    expect(r.heightPx).toBeCloseTo(30);
  });

  it('maps a 10x4 ft rect at full span when maxExtent allows two cells', () => {
    const maxExtentPx = computePlacedObjectFootprintMaxExtentPx({
      footprint: { kind: 'rect', widthFt: 10, depthFt: 4 },
      feetPerCell,
      cellPx,
    });
    const r = resolvePlacedObjectFootprintLayoutPx({
      footprint: { kind: 'rect', widthFt: 10, depthFt: 4 },
      feetPerCell,
      cellPx,
      maxExtentPx,
    });
    expect(r.widthPx).toBeCloseTo(100);
    expect(r.heightPx).toBeCloseTo(40);
  });

  it('maps a circle diameter to a square layout box', () => {
    const r = resolvePlacedObjectFootprintLayoutPx({
      footprint: { kind: 'circle', diameterFt: 4 },
      feetPerCell,
      cellPx,
      maxExtentPx: cellPx,
    });
    expect(r.widthPx).toBeCloseTo(40);
    expect(r.heightPx).toBeCloseTo(40);
  });

  it('uniformly scales down when footprint exceeds max extent', () => {
    const r = resolvePlacedObjectFootprintLayoutPx({
      footprint: { kind: 'rect', widthFt: 10, depthFt: 10 },
      feetPerCell,
      cellPx,
      maxExtentPx: cellPx,
    });
    expect(r.widthPx).toBeLessThanOrEqual(50);
    expect(r.heightPx).toBeLessThanOrEqual(50);
    expect(r.widthPx).toBeCloseTo(r.heightPx);
  });

  it('uniformly scales down when natural span exceeds PLACED_OBJECT_FOOTPRINT_MAX_EXTENT_CELLS', () => {
    const maxExtentPx = computePlacedObjectFootprintMaxExtentPx({
      footprint: { kind: 'rect', widthFt: 40, depthFt: 40 },
      feetPerCell,
      cellPx,
    });
    expect(maxExtentPx).toBe(300); // 6 * 50
    const r = resolvePlacedObjectFootprintLayoutPx({
      footprint: { kind: 'rect', widthFt: 40, depthFt: 40 },
      feetPerCell,
      cellPx,
      maxExtentPx,
    });
    expect(r.widthPx).toBeCloseTo(300);
    expect(r.heightPx).toBeCloseTo(300);
  });
});
