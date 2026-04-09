// @vitest-environment node
/**
 * Phase D — resolver geometry stability: same {@link PlacedObjectGeometryLayoutContext} inputs must yield
 * stable `layoutWidthPx` / `layoutHeightPx` / anchor offsets. Regressions here are math bugs, not CSS.
 */
import { describe, expect, it } from 'vitest';

import { SQUARE_GRID_GAP_PX } from '@/shared/domain/grid/squareGridOverlayGeometry';
import { buildPlacedObjectGeometryLayoutContextFromEncounter } from '@/shared/domain/locations/map/placedObjectGeometryLayoutContext';

import { resolvePlacedObjectCellVisualFromRenderItem } from '../resolvePlacedObjectCellVisual';

const tableLargeItem = {
  id: '1',
  authorCellId: '0,0',
  combatCellId: 'c-0-0',
  kind: 'table' as const,
  authoredPlaceKindId: 'table',
  variantId: 'rect_wood_10x4',
};

describe('resolvePlacedObjectCellVisualFromRenderItem — geometry stability', () => {
  it('encounter factory context: stable layout box + east-edge anchor offsets (tactical grid parity)', () => {
    const ctx = buildPlacedObjectGeometryLayoutContextFromEncounter({
      cellFeet: 5,
      cellPx: 50,
    });
    const v = resolvePlacedObjectCellVisualFromRenderItem(tableLargeItem, ctx);
    expect(v.layoutWidthPx).toBeCloseTo(100);
    expect(v.layoutHeightPx).toBeCloseTo(40);
    const half = (50 + SQUARE_GRID_GAP_PX) / 2;
    expect(v.layoutAnchorOffsetXPx).toBeCloseTo(half);
    expect(v.layoutAnchorOffsetYPx).toBe(0);
  });

  it('layout box does not depend on gapPx when placement anchor is off', () => {
    const a = resolvePlacedObjectCellVisualFromRenderItem(tableLargeItem, {
      feetPerCell: 5,
      cellPx: 48,
      gapPx: 0,
      applyPlacementAnchor: false,
    });
    const b = resolvePlacedObjectCellVisualFromRenderItem(tableLargeItem, {
      feetPerCell: 5,
      cellPx: 48,
      gapPx: 99,
      applyPlacementAnchor: false,
    });
    expect(a.layoutWidthPx).toBeCloseTo(b.layoutWidthPx!);
    expect(a.layoutHeightPx).toBeCloseTo(b.layoutHeightPx!);
  });

  it('east-edge anchor offset uses authoritative square gutter with applyPlacementAnchor', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem(tableLargeItem, {
      feetPerCell: 5,
      cellPx: 50,
      gapPx: SQUARE_GRID_GAP_PX,
      applyPlacementAnchor: true,
    });
    const half = (50 + SQUARE_GRID_GAP_PX) / 2;
    expect(v.layoutAnchorOffsetXPx).toBeCloseTo(half);
    expect(v.layoutAnchorOffsetYPx).toBe(0);
  });

  it('circle footprint variant: square layout box from diameter', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem(
      {
        id: '1',
        authorCellId: '0,0',
        combatCellId: 'c-0-0',
        kind: 'table',
        authoredPlaceKindId: 'table',
        variantId: 'circle_wood',
      },
      { feetPerCell: 5, cellPx: 50, applyPlacementAnchor: false },
    );
    // 4 ft diameter → 4/5 * 50 = 40 px per side
    expect(v.layoutWidthPx).toBeCloseTo(40);
    expect(v.layoutHeightPx).toBeCloseTo(40);
  });

  it('long rect footprint (stairs): layout exceeds single cell height without uniform scale when extent allows', () => {
    const v = resolvePlacedObjectCellVisualFromRenderItem(
      {
        id: '1',
        authorCellId: '0,0',
        combatCellId: 'c-0-0',
        kind: 'stairs',
        authoredPlaceKindId: 'stairs',
        variantId: 'straight',
      },
      { feetPerCell: 5, cellPx: 50, applyPlacementAnchor: false },
    );
    // 4×8 ft → 40×80 px
    expect(v.layoutWidthPx).toBeCloseTo(40);
    expect(v.layoutHeightPx).toBeCloseTo(80);
  });
});
