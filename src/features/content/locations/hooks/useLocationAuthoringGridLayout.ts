import { useCallback, useMemo } from 'react';

import { locationEditorWorkspaceUiTokens } from '@/features/content/locations/domain/presentation/map/locationEditorWorkspaceUiTokens';
import { hexCellCenterPx, hexOverlayDimensions } from '@/features/content/locations/components/authoring/geometry/hexGridMapOverlayGeometry';
import { squareCellCenterPx, SQUARE_GRID_GAP_PX } from '@/features/content/locations/components/authoring/geometry/squareGridMapOverlayGeometry';

const GRID_GAP_PX = SQUARE_GRID_GAP_PX;
const MIN_CELL_PX = 24;
const CANVAS_INSET_PX = 48;

export function useLocationAuthoringGridLayout(
  validPreview: boolean,
  cols: number,
  rows: number,
  isHex: boolean,
  leftChromeWidthPx: number,
) {
  const gridSizePx = useMemo(() => {
    if (!validPreview) return { width: 0, hexCellPx: 0 };
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const canvasH = vh - locationEditorWorkspaceUiTokens.headerHeightPx - CANVAS_INSET_PX * 2;
    const canvasW =
      vw -
      locationEditorWorkspaceUiTokens.rightRailWidthPx -
      CANVAS_INSET_PX * 2 -
      leftChromeWidthPx;

    if (isHex) {
      const hexRatio = Math.sqrt(3) / 2;
      const maxHexW_fromW = (canvasW - 0.25) / (0.75 * (cols - 1) + 1);
      const maxHexH = canvasH / ((rows - 1) + 1 + 0.5);
      const maxHexW_fromH = maxHexH / hexRatio;
      const hexCellPx = Math.max(MIN_CELL_PX, Math.floor(Math.min(maxHexW_fromW, maxHexW_fromH)));
      const width = Math.ceil(0.75 * hexCellPx * (cols - 1) + hexCellPx);
      return { width, hexCellPx };
    }

    const vertGaps = Math.max(0, rows - 1) * GRID_GAP_PX;
    const horzGaps = Math.max(0, cols - 1) * GRID_GAP_PX;
    const cellFromH = (canvasH - vertGaps) / rows;
    const cellFromW = (canvasW - horzGaps) / cols;
    const cellSize = Math.max(MIN_CELL_PX, Math.floor(Math.min(cellFromH, cellFromW)));
    return { width: cellSize * cols + horzGaps, hexCellPx: 0 };
  }, [validPreview, cols, rows, isHex, leftChromeWidthPx]);

  const squareGridGeometry = useMemo(() => {
    if (!validPreview || isHex || gridSizePx.width <= 0) return null;
    const horzGaps = Math.max(0, cols - 1) * GRID_GAP_PX;
    const vertGaps = Math.max(0, rows - 1) * GRID_GAP_PX;
    const cellPx = (gridSizePx.width - horzGaps) / cols;
    const height = rows * cellPx + vertGaps;
    return { cellPx, width: gridSizePx.width, height };
  }, [validPreview, isHex, cols, rows, gridSizePx.width]);

  const hexGridGeometry = useMemo(() => {
    if (!validPreview || !isHex || gridSizePx.hexCellPx <= 0) return null;
    const dims = hexOverlayDimensions(cols, rows, gridSizePx.hexCellPx);
    return { hexSize: gridSizePx.hexCellPx, ...dims };
  }, [validPreview, isHex, cols, rows, gridSizePx.hexCellPx]);

  const cellCenterPx = useCallback(
    (cellId: string): { cx: number; cy: number } | null => {
      if (isHex && hexGridGeometry) return hexCellCenterPx(cellId, hexGridGeometry.hexSize);
      if (squareGridGeometry) {
        return squareCellCenterPx(cellId, squareGridGeometry.cellPx, GRID_GAP_PX);
      }
      return null;
    },
    [isHex, hexGridGeometry, squareGridGeometry],
  );

  return { gridSizePx, squareGridGeometry, hexGridGeometry, cellCenterPx };
}
