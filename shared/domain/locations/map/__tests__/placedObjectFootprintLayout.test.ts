// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolvePlacedObjectFootprintLayoutPx } from '../placedObjectFootprintLayout';

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
});
