/**
 * Re-exports square overlay pixel math from shared grid geometry (single source of truth).
 */
export {
  BETWEEN_EDGE_ID_RE,
  SQUARE_GRID_GAP_PX,
  resolveSquareCellIdFromGridLocalPx,
  squareCellCenterPx,
  squareSharedEdgeSegmentPx,
  squareEdgeSegmentPxFromEdgeId,
} from '@/shared/domain/grid/squareGridOverlayGeometry';
