import Box from '@mui/material/Box';

import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import type { ResolvedEdgeTarget } from '@/features/content/locations/domain/authoring/editor';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import type {
  EdgeSegmentGeometry,
  LineSegment2D,
} from '@/shared/domain/locations/map/locationMapGeometry.types';

import { HexMapAuthoringSvgOverlay } from '../mapGrid/authoring/HexMapAuthoringSvgOverlay';
import { SquareMapAuthoringSvgOverlay } from '../mapGrid/authoring/SquareMapAuthoringSvgOverlay';
import type { LocationGridPathSvgPreviewItem } from './locationGridAuthoringPathSvgPreview';

type SquareGeom = { width: number; height: number; cellPx: number };
type HexGeom = { width: number; height: number };

/**
 * Absolutely positioned square overlay host (paths, edges, boundary paint) above the cell grid.
 */
export function LocationGridAuthoringSquareMapOverlayLayer(props: {
  visible: boolean;
  squareGridGeometry: SquareGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  pathSvgData: readonly LocationGridPathSvgPreviewItem[];
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
  edgeStrokeSnapshot: readonly string[];
  edgeHoverTarget: ResolvedEdgeTarget | null;
  edgeEraseActive: boolean;
  committedEdgeSegmentGeometry: readonly EdgeSegmentGeometry[];
}) {
  const {
    visible,
    squareGridGeometry,
    mapUi,
    pathSvgData,
    mapSelection,
    selectHoverTarget,
    edgeStrokeSnapshot,
    edgeHoverTarget,
    edgeEraseActive,
    committedEdgeSegmentGeometry,
  } = props;

  if (!visible || !squareGridGeometry) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: squareGridGeometry.width,
        height: squareGridGeometry.height,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <SquareMapAuthoringSvgOverlay
        width={squareGridGeometry.width}
        height={squareGridGeometry.height}
        cellPx={squareGridGeometry.cellPx}
        mapUi={mapUi}
        pathSvgData={[...pathSvgData]}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
        edgeStrokeSnapshot={[...edgeStrokeSnapshot]}
        edgeHoverTarget={edgeHoverTarget}
        edgeEraseActive={edgeEraseActive}
        committedEdgeSegmentGeometry={[...committedEdgeSegmentGeometry]}
      />
    </Box>
  );
}

/**
 * Absolutely positioned hex overlay host (paths + region outlines) above the cell grid.
 */
export function LocationGridAuthoringHexMapOverlayLayer(props: {
  visible: boolean;
  hexGridGeometry: HexGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  pathSvgData: readonly LocationGridPathSvgPreviewItem[];
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
  hexSelectedRegionBoundarySegments: LineSegment2D[];
  hexHoverRegionBoundarySegments: LineSegment2D[];
}) {
  const {
    visible,
    hexGridGeometry,
    mapUi,
    pathSvgData,
    mapSelection,
    selectHoverTarget,
    hexSelectedRegionBoundarySegments,
    hexHoverRegionBoundarySegments,
  } = props;

  if (!visible || !hexGridGeometry) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: hexGridGeometry.width,
        height: hexGridGeometry.height,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <HexMapAuthoringSvgOverlay
        width={hexGridGeometry.width}
        height={hexGridGeometry.height}
        mapUi={mapUi}
        pathSvgData={[...pathSvgData]}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
        hexSelectedRegionBoundarySegments={hexSelectedRegionBoundarySegments}
        hexHoverRegionBoundarySegments={hexHoverRegionBoundarySegments}
      />
    </Box>
  );
}
