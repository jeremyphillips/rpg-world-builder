import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import { getNeighborPoints } from '@/shared/domain/grid/gridHelpers';
import type { LocationMapPathAuthoringEntry } from '@/shared/domain/locations';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import { pathEntryToPolylineGeometry } from '@/shared/domain/locations/map/locationMapPathPolyline.helpers';

import { polylinePoint2DToSmoothSvgPath } from '../authoring/geometry/pathOverlayRendering';

/** Path overlay items for {@link SquareMapAuthoringSvgOverlay} / {@link HexMapAuthoringSvgOverlay} (placement preview + committed chains). */
export type LocationGridPathSvgPreviewItem = {
  pathId: string;
  kind: LocationMapPathKindId;
  d: string;
};

/**
 * Builds smoothed SVG path `d` strings for path chains plus optional two-cell preview while placing
 * a path segment (draw mode). Pure geometry; no React.
 */
export function buildLocationGridPathSvgPreviewData(args: {
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  placePathAnchorCellId: string | null;
  placeHoverCellId: string | null;
  cellCenterPx: (cellId: string) => { cx: number; cy: number } | null;
  gridGeometry: string;
  cols: number;
  rows: number;
  activePathKind: LocationMapPathKindId | null;
}): LocationGridPathSvgPreviewItem[] {
  const {
    pathEntries,
    placePathAnchorCellId,
    placeHoverCellId,
    cellCenterPx,
    gridGeometry,
    cols,
    rows,
    activePathKind,
  } = args;

  const chains = pathEntries.map((pe) => ({
    id: pe.id,
    kind: pe.kind,
    cells: [...pe.cellIds],
  }));
  if (chains.length === 0 && !placePathAnchorCellId) return [];

  let extendIdx = -1;
  let extendCell: string | null = null;
  let prepend = false;

  if (placePathAnchorCellId && placeHoverCellId && placePathAnchorCellId !== placeHoverCellId) {
    const pa = parseGridCellId(placePathAnchorCellId);
    const pb = parseGridCellId(placeHoverCellId);
    if (pa && pb) {
      const geom = (gridGeometry === 'hex' ? 'hex' : 'square') as 'square' | 'hex';
      const neighbors = getNeighborPoints({ geometry: geom, columns: cols, rows }, pa);
      if (neighbors.some((n) => n.x === pb.x && n.y === pb.y)) {
        for (let i = 0; i < chains.length; i++) {
          const c = chains[i];
          if (c.cells[c.cells.length - 1] === placePathAnchorCellId) {
            extendIdx = i;
            extendCell = placeHoverCellId;
            break;
          }
          if (c.cells[0] === placePathAnchorCellId) {
            extendIdx = i;
            extendCell = placeHoverCellId;
            prepend = true;
            break;
          }
        }
        if (extendIdx < 0) {
          extendCell = placeHoverCellId;
        }
      }
    }
  }

  const centerFn = (cellId: string) => cellCenterPx(cellId);
  const result: LocationGridPathSvgPreviewItem[] = [];

  for (let i = 0; i < chains.length; i++) {
    let cells = chains[i].cells;
    if (i === extendIdx && extendCell) {
      cells = prepend ? [extendCell, ...cells] : [...cells, extendCell];
    }
    const poly = pathEntryToPolylineGeometry(
      { id: chains[i].id, kind: chains[i].kind, cellIds: cells },
      centerFn,
    );
    if (!poly) continue;
    result.push({
      pathId: chains[i].id,
      kind: poly.kind,
      d: polylinePoint2DToSmoothSvgPath(poly.points),
    });
  }

  if (extendIdx < 0 && extendCell && placePathAnchorCellId) {
    const previewPoly = pathEntryToPolylineGeometry(
      {
        id: 'preview',
        kind: activePathKind ?? 'road',
        cellIds: [placePathAnchorCellId, extendCell],
      },
      centerFn,
    );
    if (previewPoly) {
      result.push({
        pathId: '__preview__',
        kind: previewPoly.kind,
        d: polylinePoint2DToSmoothSvgPath(previewPoly.points),
      });
    }
  }

  return result;
}
