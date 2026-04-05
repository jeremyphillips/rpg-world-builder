// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { hexCellCenterPx, hexOverlayDimensions, resolveNearestHexCell } from '../hexGridMapOverlayGeometry';

describe('hexGridMapOverlayGeometry', () => {
  const hexSize = 48;
  const hexW = hexSize;
  const hexH = hexSize * (Math.sqrt(3) / 2);
  const colStep = hexW * 0.75;
  const rowStep = hexH;

  describe('hexCellCenterPx', () => {
    it('returns center of origin cell', () => {
      const result = hexCellCenterPx('0,0', hexSize);
      expect(result).toEqual({ cx: hexW / 2, cy: hexH / 2 });
    });

    it('even column cell has no vertical offset', () => {
      const result = hexCellCenterPx('2,1', hexSize);
      expect(result).not.toBeNull();
      expect(result!.cx).toBeCloseTo(2 * colStep + hexW / 2);
      expect(result!.cy).toBeCloseTo(1 * rowStep + hexH / 2);
    });

    it('odd column cell is shifted down by half a row', () => {
      const result = hexCellCenterPx('1,0', hexSize);
      expect(result).not.toBeNull();
      expect(result!.cx).toBeCloseTo(1 * colStep + hexW / 2);
      expect(result!.cy).toBeCloseTo(0 * rowStep + hexH * 0.5 + hexH / 2);
    });

    it('returns null for invalid cellId', () => {
      expect(hexCellCenterPx('bad', hexSize)).toBeNull();
    });
  });

  describe('hexOverlayDimensions', () => {
    it('returns correct dimensions for a 4x3 grid', () => {
      const dims = hexOverlayDimensions(4, 3, hexSize);
      expect(dims.width).toBeCloseTo(colStep * 3 + hexW);
      expect(dims.height).toBeCloseTo(rowStep * 2 + hexH + rowStep * 0.5);
    });

    it('returns zero for empty grid', () => {
      expect(hexOverlayDimensions(0, 0, hexSize)).toEqual({ width: 0, height: 0 });
    });

    it('single cell grid has hex dimensions', () => {
      const dims = hexOverlayDimensions(1, 1, hexSize);
      expect(dims.width).toBeCloseTo(hexW);
      expect(dims.height).toBeCloseTo(hexH + rowStep * 0.5);
    });
  });

  describe('resolveNearestHexCell', () => {
    it('resolves pixel at cell center to that cell', () => {
      const center = hexCellCenterPx('0,0', hexSize)!;
      expect(resolveNearestHexCell(center.cx, center.cy, 4, 4, hexSize)).toBe('0,0');
    });

    it('resolves pixel at odd-column cell center', () => {
      const center = hexCellCenterPx('1,0', hexSize)!;
      expect(resolveNearestHexCell(center.cx, center.cy, 4, 4, hexSize)).toBe('1,0');
    });

    it('resolves pixel between two cells to the nearest one', () => {
      const a = hexCellCenterPx('0,0', hexSize)!;
      const b = hexCellCenterPx('1,0', hexSize)!;
      const midX = (a.cx + b.cx) / 2;
      const midY = (a.cy + b.cy) / 2;
      const result = resolveNearestHexCell(midX, midY, 4, 4, hexSize);
      expect(result === '0,0' || result === '1,0').toBe(true);
    });

    it('returns null for empty grid', () => {
      expect(resolveNearestHexCell(10, 10, 0, 0, hexSize)).toBeNull();
    });
  });
});
