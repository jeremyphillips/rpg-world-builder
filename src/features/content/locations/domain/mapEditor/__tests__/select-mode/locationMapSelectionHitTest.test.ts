import { describe, expect, it } from 'vitest';

import type { EdgeSegmentGeometry, PathPolylineGeometry } from '@/shared/domain/locations/map/locationMapGeometry.types';

import {
  DEFAULT_EDGE_PICK_HALF_WIDTH_PX,
  DEFAULT_PATH_PICK_TOLERANCE_PX,
  distancePointToSegmentSquared,
  resolveNearestEdgeHit,
  resolveNearestPathHit,
} from '../../select-mode';

describe('distancePointToSegmentSquared', () => {
  it('is zero for a point on the segment', () => {
    const seg = { x1: 0, y1: 0, x2: 10, y2: 0 };
    expect(distancePointToSegmentSquared(5, 0, seg)).toBe(0);
  });

  it('clamps to endpoints', () => {
    const seg = { x1: 0, y1: 0, x2: 10, y2: 0 };
    expect(distancePointToSegmentSquared(-5, 0, seg)).toBe(25);
  });
});

describe('resolveNearestEdgeHit', () => {
  const edges: EdgeSegmentGeometry[] = [
    {
      edgeId: 'e1',
      kind: 'wall',
      segment: { x1: 0, y1: 0, x2: 100, y2: 0 },
    },
    {
      edgeId: 'e2',
      kind: 'door',
      segment: { x1: 0, y1: 50, x2: 100, y2: 50 },
    },
  ];

  it('returns nearest edge within tolerance', () => {
    const hit = resolveNearestEdgeHit(50, 3, edges, DEFAULT_EDGE_PICK_HALF_WIDTH_PX);
    expect(hit).toEqual({ edgeId: 'e1' });
  });

  it('returns null when too far', () => {
    const hit = resolveNearestEdgeHit(50, 65, edges, DEFAULT_EDGE_PICK_HALF_WIDTH_PX);
    expect(hit).toBeNull();
  });
});

describe('resolveNearestPathHit', () => {
  const paths: PathPolylineGeometry[] = [
    {
      id: 'p-a',
      kind: 'road',
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    },
    {
      id: 'p-b',
      kind: 'river',
      points: [
        { x: 0, y: 100 },
        { x: 100, y: 100 },
      ],
    },
  ];

  it('returns nearest path within tolerance', () => {
    const hit = resolveNearestPathHit(40, 4, paths, DEFAULT_PATH_PICK_TOLERANCE_PX);
    expect(hit).toEqual({ pathId: 'p-a' });
  });

  it('returns null when too far', () => {
    const hit = resolveNearestPathHit(40, 80, paths, DEFAULT_PATH_PICK_TOLERANCE_PX);
    expect(hit).toBeNull();
  });
});
