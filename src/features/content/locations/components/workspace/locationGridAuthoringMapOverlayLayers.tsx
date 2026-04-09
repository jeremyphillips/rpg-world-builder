import Box from '@mui/material/Box';
import { useMemo } from 'react';

import { makeGridCellId } from '@/shared/domain/grid';
import type { LocationMapUiResolvedStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import type { ResolvedEdgeTarget } from '@/features/content/locations/domain/authoring/editor';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';
import type {
  EdgeSegmentGeometry,
  LineSegment2D,
} from '@/shared/domain/locations/map/locationMapGeometry.types';

import { SQUARE_GRID_GAP_PX } from '@/features/content/locations/components/authoring/geometry/squareGridMapOverlayGeometry';
import {
  GRID_CELL_AUTHORING_FILL_CLASS,
  resolveSquareTerrainFillLayerSx,
} from '../mapGrid/mapGridAuthoringCellVisual.builder';
import { shouldApplyCellSelectedChrome } from '../mapGrid/mapGridCellVisualState';
import {
  HexMapAuthoringPathSvgOverlay,
  HexMapAuthoringRegionSvgOverlay,
} from '../mapGrid/authoring/HexMapAuthoringSvgOverlay';
import { SquareMapAuthoringSvgOverlay } from '../mapGrid/authoring/SquareMapAuthoringSvgOverlay';
import type { LocationGridPathSvgPreviewItem } from './locationGridAuthoringPathSvgPreview';
import {
  LocationMapAuthoredObjectIconsLayer,
  LocationMapHexAuthoredObjectIconsLayer,
} from '../mapGrid/LocationMapAuthoredObjectIconsLayer';
import type { PlacedObjectGeometryLayoutContext } from '@/shared/domain/locations/map/placedObjectGeometryLayoutContext';
import type { LocationMapAuthoredObjectRenderItem } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.types';
import type { GridCell, GridEditorProps } from '../mapGrid/GridEditor';

import { MAP_AUTHORING_LAYER_Z } from './mapAuthoringLayerZ';

type SquareGeom = { width: number; height: number; cellPx: number };
type HexGeom = { width: number; height: number };

/**
 * Square terrain swatches only — **below** path/edge SVG ({@link MAP_AUTHORING_LAYER_Z.squarePathsAndEdges}).
 * Interactive chrome (borders, overlays) stays in `GridEditor` with `omitTerrainFill`.
 */
export function LocationGridAuthoringSquareTerrainLayer(props: {
  visible: boolean;
  squareGridGeometry: SquareGeom | null;
  columns: number;
  rows: number;
  getCellFillPresentation?: GridEditorProps['getCellFillPresentation'];
  selectedCellId?: string | null;
  excludedCellIds?: string[];
  selectHoverTarget?: LocationMapSelection;
  pointerHoverCellId: string | null;
  disabled?: boolean;
}) {
  const {
    visible,
    squareGridGeometry,
    columns,
    rows,
    getCellFillPresentation,
    selectedCellId,
    excludedCellIds,
    selectHoverTarget,
    pointerHoverCellId,
    disabled = false,
  } = props;

  const safeCols = Math.max(0, Math.floor(columns));
  const safeRows = Math.max(0, Math.floor(rows));
  const excludedSet = useMemo(
    () => new Set(excludedCellIds ?? []),
    [excludedCellIds],
  );

  if (!visible || !squareGridGeometry) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: squareGridGeometry.width,
        height: squareGridGeometry.height,
        zIndex: MAP_AUTHORING_LAYER_Z.terrain,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))`,
          gap: `${SQUARE_GRID_GAP_PX}px`,
          width: '100%',
        }}
      >
        {Array.from({ length: safeRows * safeCols }, (_, i) => {
          const x = i % safeCols;
          const y = Math.floor(i / safeCols);
          const cellId = makeGridCellId(x, y);
          const cell: GridCell = { cellId, x, y };
          const selected = shouldApplyCellSelectedChrome(selectedCellId, cellId);
          const excluded = excludedSet.has(cellId);
          const fillPresentation = getCellFillPresentation?.(cell);
          const fillSx = resolveSquareTerrainFillLayerSx({
            cellId,
            selected,
            excluded,
            fillPresentation,
            disabled,
            selectHoverTarget,
            pointerHoverCellId,
          });
          return (
            <Box
              key={cellId}
              sx={{
                aspectRatio: '1',
                minWidth: 0,
                minHeight: 0,
                width: '100%',
                position: 'relative',
              }}
            >
              <Box className={GRID_CELL_AUTHORING_FILL_CLASS} sx={fillSx} aria-hidden />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * Absolutely positioned square overlay (paths, edges, boundary paint) **above** terrain fills,
 * **below** interactive grid chrome ({@link MAP_AUTHORING_LAYER_Z.cellGrid}).
 */
export function LocationGridAuthoringSquareMapOverlayLayer(props: {
  visible: boolean;
  squareGridGeometry: SquareGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  hostScale: string;
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
    hostScale,
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
        zIndex: MAP_AUTHORING_LAYER_Z.squarePathsAndEdges,
        pointerEvents: 'none',
      }}
    >
      <SquareMapAuthoringSvgOverlay
        width={squareGridGeometry.width}
        height={squareGridGeometry.height}
        cellPx={squareGridGeometry.cellPx}
        mapUi={mapUi}
        hostScale={hostScale}
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
 * Hex path splines — **above** tessellated cells ({@link MAP_AUTHORING_LAYER_Z.cellGrid}) so strokes stay visible.
 */
export function LocationGridAuthoringHexMapPathOverlayLayer(props: {
  visible: boolean;
  hexGridGeometry: HexGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  hostScale: string;
  pathSvgData: readonly LocationGridPathSvgPreviewItem[];
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
}) {
  const {
    visible,
    hexGridGeometry,
    mapUi,
    hostScale,
    pathSvgData,
    mapSelection,
    selectHoverTarget,
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
        zIndex: MAP_AUTHORING_LAYER_Z.hexPathsOverGrid,
        pointerEvents: 'none',
      }}
    >
      <HexMapAuthoringPathSvgOverlay
        width={hexGridGeometry.width}
        height={hexGridGeometry.height}
        mapUi={mapUi}
        hostScale={hostScale}
        pathSvgData={[...pathSvgData]}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
      />
    </Box>
  );
}

/**
 * Hex placed-object + place-preview glyphs — **above** path SVG, **below** region hull outlines.
 */
export function LocationGridAuthoringHexMapPlacedObjectsOverlayLayer(props: {
  visible: boolean;
  hexGridGeometry: HexGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  selectHoverTarget: LocationMapSelection;
  items: readonly LocationMapAuthoredObjectRenderItem[];
  hexSize: number;
}) {
  const { visible, hexGridGeometry, mapUi, selectHoverTarget, items, hexSize } = props;

  if (!visible || !hexGridGeometry || items.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: hexGridGeometry.width,
        height: hexGridGeometry.height,
        zIndex: MAP_AUTHORING_LAYER_Z.globalPlacedObjects,
        pointerEvents: 'none',
      }}
    >
      <LocationMapHexAuthoredObjectIconsLayer
        items={items}
        hexSize={hexSize}
        mapUi={mapUi}
        footprintLayout={null}
        selectHoverTarget={selectHoverTarget}
      />
    </Box>
  );
}

/**
 * Hex region hull outlines — **above** paths and placed-object glyphs (selection UX).
 */
export function LocationGridAuthoringHexMapRegionOverlayLayer(props: {
  visible: boolean;
  hexGridGeometry: HexGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  mapSelection: LocationMapSelection;
  selectHoverTarget: LocationMapSelection;
  hexSelectedRegionBoundarySegments: LineSegment2D[];
  hexHoverRegionBoundarySegments: LineSegment2D[];
}) {
  const {
    visible,
    hexGridGeometry,
    mapUi,
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
        zIndex: MAP_AUTHORING_LAYER_Z.hexRegionOutlines,
        pointerEvents: 'none',
      }}
    >
      <HexMapAuthoringRegionSvgOverlay
        width={hexGridGeometry.width}
        height={hexGridGeometry.height}
        mapUi={mapUi}
        mapSelection={mapSelection}
        selectHoverTarget={selectHoverTarget}
        hexSelectedRegionBoundarySegments={hexSelectedRegionBoundarySegments}
        hexHoverRegionBoundarySegments={hexHoverRegionBoundarySegments}
      />
    </Box>
  );
}

/**
 * Square global placed-object + place-preview glyphs — same z-slot as {@link LocationGridAuthoringHexMapPlacedObjectsOverlayLayer}.
 */
export function LocationGridAuthoringSquareMapPlacedObjectsOverlayLayer(props: {
  visible: boolean;
  squareGridGeometry: SquareGeom | null;
  mapUi: LocationMapUiResolvedStyles;
  selectHoverTarget: LocationMapSelection;
  items: readonly LocationMapAuthoredObjectRenderItem[];
  cellPx: number;
  gapPx: number;
  /** Same as {@link LocationMapCellAuthoringOverlay} — registry footprint sizing vs `cellPx`. */
  footprintLayout: PlacedObjectGeometryLayoutContext | null;
}) {
  const { visible, squareGridGeometry, mapUi, selectHoverTarget, items, cellPx, gapPx, footprintLayout } =
    props;

  if (!visible || !squareGridGeometry || items.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: squareGridGeometry.width,
        height: squareGridGeometry.height,
        zIndex: MAP_AUTHORING_LAYER_Z.globalPlacedObjects,
        pointerEvents: 'none',
      }}
    >
      <LocationMapAuthoredObjectIconsLayer
        items={items}
        cellPx={cellPx}
        gapPx={gapPx}
        mapUi={mapUi}
        footprintLayout={footprintLayout ?? undefined}
        selectHoverTarget={selectHoverTarget}
      />
    </Box>
  );
}
