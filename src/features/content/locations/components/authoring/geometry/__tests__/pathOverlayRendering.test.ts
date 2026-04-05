// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { LocationMapPathAuthoringEntry } from '@/shared/domain/locations/map/locationMap.types';

import { distancePointToSegmentSquared } from '@/features/content/locations/domain/authoring/editor';

import {
  chainToSmoothSvgPath,
  pathEntriesToSvgPaths,
  polylinePoint2DToSmoothSvgPath,
  sampleSmoothPathCenterlineForPicking,
} from '../pathOverlayRendering';

function distSqToPolyline(
  px: number,
  py: number,
  pts: readonly { x: number; y: number }[],
): number {
  if (pts.length < 2) {
    return Number.POSITIVE_INFINITY;
  }
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const d = distancePointToSegmentSquared(px, py, {
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
    });
    if (d < best) {
      best = d;
    }
  }
  return best;
}

function pathEntry(id: string, kind: 'road' | 'river', cellIds: string[]): LocationMapPathAuthoringEntry {
  return { id, kind, cellIds };
}

describe('chainToSmoothSvgPath', () => {
  it('returns empty string for fewer than 2 points', () => {
    expect(chainToSmoothSvgPath([])).toBe('');
    expect(chainToSmoothSvgPath([{ cx: 0, cy: 0 }])).toBe('');
  });

  it('produces a straight line M...L for 2 points', () => {
    const d = chainToSmoothSvgPath([{ cx: 0, cy: 0 }, { cx: 100, cy: 50 }]);
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/L/);
    expect(d).not.toMatch(/C/);
  });

  it('produces smooth cubic bezier C commands for 3+ points', () => {
    const d = chainToSmoothSvgPath([
      { cx: 0, cy: 0 },
      { cx: 50, cy: 30 },
      { cx: 100, cy: 0 },
    ]);
    expect(d).toMatch(/^M/);
    expect(d).toMatch(/C/);
  });

  it('produces multiple C commands for 4+ points', () => {
    const d = chainToSmoothSvgPath([
      { cx: 0, cy: 0 },
      { cx: 50, cy: 30 },
      { cx: 100, cy: 0 },
      { cx: 150, cy: 30 },
    ]);
    const cCount = (d.match(/C/g) ?? []).length;
    expect(cCount).toBeGreaterThanOrEqual(3);
  });
});

describe('sampleSmoothPathCenterlineForPicking', () => {
  it('returns endpoints only for a 2-point chain', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ];
    expect(sampleSmoothPathCenterlineForPicking(pts)).toEqual(pts);
  });

  it('densifies 3+ point chains beyond raw centerline vertex count', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 50, y: 80 },
      { x: 100, y: 0 },
    ];
    const sampled = sampleSmoothPathCenterlineForPicking(pts, { samplesPerBezierSegment: 6 });
    expect(sampled.length).toBeGreaterThan(pts.length);
  });

  it('samples bulge away from the raw centerline where the smooth curve deviates', () => {
    const centerline = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    ];
    const smooth = sampleSmoothPathCenterlineForPicking(centerline, { samplesPerBezierSegment: 16 });
    let maxRawSq = 0;
    for (const p of smooth) {
      const dRaw = distSqToPolyline(p.x, p.y, centerline);
      if (dRaw > maxRawSq) {
        maxRawSq = dRaw;
      }
      const dSmooth = distSqToPolyline(p.x, p.y, smooth);
      expect(dSmooth).toBeLessThanOrEqual(1e-6);
    }
    expect(maxRawSq).toBeGreaterThan(1);
  });
});

describe('polylinePoint2DToSmoothSvgPath', () => {
  it('matches chainToSmoothSvgPath for equivalent points', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ];
    const a = polylinePoint2DToSmoothSvgPath(pts);
    const b = chainToSmoothSvgPath([
      { cx: 0, cy: 0 },
      { cx: 100, cy: 50 },
    ]);
    expect(a).toBe(b);
  });
});

describe('pathEntriesToSvgPaths', () => {
  const centerFn = (cellId: string) => {
    const [x, y] = cellId.split(',').map(Number);
    return { cx: x * 50, cy: y * 50 };
  };

  it('returns empty for no path entries', () => {
    expect(pathEntriesToSvgPaths([], centerFn)).toEqual([]);
  });

  it('produces one svg path per authored chain', () => {
    const paths = pathEntriesToSvgPaths(
      [pathEntry('a', 'road', ['0,0', '1,0', '2,0'])],
      centerFn,
    );
    expect(paths).toHaveLength(1);
    expect(paths[0].kind).toBe('road');
    expect(paths[0].d).toMatch(/^M/);
  });

  it('uses smooth curves for chains of 3+ cells', () => {
    const paths = pathEntriesToSvgPaths(
      [pathEntry('a', 'road', ['0,0', '1,0', '2,0'])],
      centerFn,
    );
    expect(paths[0].d).toMatch(/C/);
  });
});
