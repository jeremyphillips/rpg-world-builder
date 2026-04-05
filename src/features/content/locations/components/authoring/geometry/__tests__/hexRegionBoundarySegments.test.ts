// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  hexExposedRegionBoundarySegments,
  sharedEdgeBetweenHexCells,
} from '../hexRegionBoundarySegments';

describe('hexRegionBoundarySegments', () => {
  const hexSize = 48;
  const hexW = hexSize;
  const hexH = hexSize * (Math.sqrt(3) / 2);

  describe('sharedEdgeBetweenHexCells', () => {
    it('returns a segment between two adjacent in-bounds hexes', () => {
      const seg = sharedEdgeBetweenHexCells(0, 0, 1, 0, hexW, hexH);
      expect(seg).not.toBeNull();
      expect(seg!.x1).not.toBe(seg!.x2);
      expect(seg!.y1).not.toBe(seg!.y2);
    });
  });

  describe('hexExposedRegionBoundarySegments', () => {
    it('emits six edges for a single isolated hex', () => {
      const segs = hexExposedRegionBoundarySegments(4, 4, new Set(['0,0']), hexSize);
      expect(segs).toHaveLength(6);
    });

    it('omits the shared edge between two adjacent region cells', () => {
      const segs = hexExposedRegionBoundarySegments(4, 4, new Set(['0,0', '1,0']), hexSize);
      expect(segs).toHaveLength(10);
    });

    it('includes outer edges when the region is two adjacent cells', () => {
      const segs = hexExposedRegionBoundarySegments(4, 4, new Set(['2,2', '3,2']), hexSize);
      expect(segs.length).toBeGreaterThan(0);
      expect(segs).toHaveLength(10);
    });

    it('returns empty for empty region set', () => {
      expect(hexExposedRegionBoundarySegments(4, 4, new Set(), hexSize)).toEqual([]);
    });
  });
});
