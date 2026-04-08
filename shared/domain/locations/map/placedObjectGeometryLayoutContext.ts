import { SQUARE_GRID_GAP_PX } from '@/shared/domain/grid/squareGridOverlayGeometry';

import { resolveAuthoringCellUnitFeetPerCell } from './locationCellUnitAuthoring';

/**
 * Math-only inputs for registry footprint → pixel layout and placement-anchor offsets.
 * Used by {@link resolvePlacedObjectCellVisualFromRenderItem} (locations feature).
 * Do not add shell styling, pointer behavior, or wrapper layout here.
 */
export type PlacedObjectGeometryLayoutContext = {
  feetPerCell: number;
  cellPx: number;
  /** Gutter (px) between square cells — must match overlay math and grid CSS for that surface. */
  gapPx?: number;
  /** When false, skip anchor offset (tactical centering). Default true for authoring square. */
  applyPlacementAnchor?: boolean;
};

export type PlacedObjectGeometryGridKind = 'square' | 'hex';

/**
 * Workspace / map editor: square grid with resolvable `gridCellUnit` → footprint layout; hex or bad inputs → null.
 */
export function buildPlacedObjectGeometryLayoutContextFromAuthoring(args: {
  gridKind: PlacedObjectGeometryGridKind;
  gridCellUnit: string | undefined;
  squareCellPx: number | undefined;
}): PlacedObjectGeometryLayoutContext | null {
  const { gridKind, gridCellUnit, squareCellPx } = args;
  if (gridKind === 'hex' || squareCellPx == null || gridCellUnit == null || String(gridCellUnit).trim() === '') {
    return null;
  }
  const span = resolveAuthoringCellUnitFeetPerCell(gridCellUnit);
  if (span.kind !== 'ok') return null;
  return {
    feetPerCell: span.feetPerCell,
    cellPx: squareCellPx,
    gapPx: SQUARE_GRID_GAP_PX,
    applyPlacementAnchor: true,
  };
}

/**
 * Encounter / tactical grid: `cellFeet` from the grid view model is **5** for supported grid spaces
 * today. Uses the same square gutter as {@link SQUARE_GRID_GAP_PX} (matches `CombatGrid` `inline-grid`)
 * and applies registry placement anchors so multi-cell footprints align to cell boundaries, not only
 * the anchor cell’s center.
 */
export function buildPlacedObjectGeometryLayoutContextFromEncounter(args: {
  cellFeet: number;
  cellPx: number;
}): PlacedObjectGeometryLayoutContext {
  return {
    feetPerCell: args.cellFeet,
    cellPx: args.cellPx,
    gapPx: SQUARE_GRID_GAP_PX,
    applyPlacementAnchor: true,
  };
}
