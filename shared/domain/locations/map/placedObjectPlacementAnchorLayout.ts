import type { PlacedObjectCellAnchorKind } from './placedObjectFootprint.types';

/**
 * Pixel offset from **cell-centered** placement (flex center of the author cell) so the **center** of the
 * object’s layout box sits on the **gutter midpoint** between cells (see {@link squareSharedEdgeSegmentPx}).
 * Coordinate system: **+X** right, **+Y** down; origin at cell center.
 */
export function resolvePlacedObjectCellAnchorOffsetPx(
  anchor: PlacedObjectCellAnchorKind,
  cellPx: number,
  gapPx: number,
): { offsetXPx: number; offsetYPx: number } {
  if (anchor === 'cell_center') {
    return { offsetXPx: 0, offsetYPx: 0 };
  }
  const half = (cellPx + gapPx) / 2;
  switch (anchor) {
    case 'between_cells_e':
      return { offsetXPx: half, offsetYPx: 0 };
    case 'between_cells_w':
      return { offsetXPx: -half, offsetYPx: 0 };
    case 'between_cells_s':
      return { offsetXPx: 0, offsetYPx: half };
    case 'between_cells_n':
      return { offsetXPx: 0, offsetYPx: -half };
    default:
      return { offsetXPx: 0, offsetYPx: 0 };
  }
}
