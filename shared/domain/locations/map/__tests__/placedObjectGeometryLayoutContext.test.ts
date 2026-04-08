// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { SQUARE_GRID_GAP_PX } from '@/shared/domain/grid/squareGridOverlayGeometry';

import {
  buildPlacedObjectGeometryLayoutContextFromAuthoring,
  buildPlacedObjectGeometryLayoutContextFromEncounter,
} from '../placedObjectGeometryLayoutContext';

describe('buildPlacedObjectGeometryLayoutContextFromAuthoring', () => {
  it('returns null for hex grid', () => {
    expect(
      buildPlacedObjectGeometryLayoutContextFromAuthoring({
        gridKind: 'hex',
        gridCellUnit: '5ft',
        squareCellPx: 40,
      }),
    ).toBeNull();
  });

  it('returns null when cell unit cannot resolve feet', () => {
    expect(
      buildPlacedObjectGeometryLayoutContextFromAuthoring({
        gridKind: 'square',
        gridCellUnit: '',
        squareCellPx: 40,
      }),
    ).toBeNull();
  });

  it('returns authoring square context with authoritative gutter and anchor on', () => {
    const ctx = buildPlacedObjectGeometryLayoutContextFromAuthoring({
      gridKind: 'square',
      gridCellUnit: '5ft',
      squareCellPx: 48,
    });
    expect(ctx).toEqual({
      feetPerCell: 5,
      cellPx: 48,
      gapPx: SQUARE_GRID_GAP_PX,
      applyPlacementAnchor: true,
    });
  });
});

describe('buildPlacedObjectGeometryLayoutContextFromEncounter', () => {
  it('matches tactical policy: authoritative gutter + placement anchors (parity with CombatGrid)', () => {
    expect(
      buildPlacedObjectGeometryLayoutContextFromEncounter({
        cellFeet: 5,
        cellPx: 48,
      }),
    ).toEqual({
      feetPerCell: 5,
      cellPx: 48,
      gapPx: SQUARE_GRID_GAP_PX,
      applyPlacementAnchor: true,
    });
  });
});
