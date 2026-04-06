import { hexBoundarySegmentsForRegionCells } from '../authoring/geometry/hexRegionBoundaryForAuthoring';

/**
 * Hex map: SVG boundary segments for region tinting in the authoring overlay (selection or hover).
 * Square grids do not use this path.
 */
export function buildHexAuthoringRegionBoundarySegments(args: {
  isHex: boolean;
  hexGridGeometry: { hexSize: number } | null;
  cols: number;
  rows: number;
  activeRegionId: string | null;
  regionIdByCellId: Record<string, string | undefined>;
}): ReturnType<typeof hexBoundarySegmentsForRegionCells> {
  const { isHex, hexGridGeometry, cols, rows, activeRegionId, regionIdByCellId } = args;
  if (!isHex || !hexGridGeometry || !activeRegionId) return [];
  return hexBoundarySegmentsForRegionCells(
    cols,
    rows,
    hexGridGeometry.hexSize,
    activeRegionId,
    regionIdByCellId,
  );
}
