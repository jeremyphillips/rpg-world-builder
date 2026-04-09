import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';

import {
  GridEditor,
  HexGridEditor,
  type GridCell,
} from '@/features/content/locations/components/mapGrid';
import type { GridGeometryId } from '@/shared/domain/grid/gridGeometry';
import { resolveCellFillPresentation } from '@/features/content/locations/domain/model/map/locationCellFill.types';
import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapActivePlaceSelection,
  LocationMapEditorMode,
} from '@/features/content/locations/domain/authoring/editor';
import { buildPlacePreviewRenderItem } from '@/features/content/locations/domain/authoring/editor/placePreview/buildPlacePreviewRenderItem';
import { getPlacementModeForFamily } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';
import { colorPrimitives } from '@/app/theme/colorPrimitives';
import { resolveLocationMapUiStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import type { Location } from '@/features/content/locations/domain/model/location';
import { useLocationAuthoringGridLayout } from '@/features/content/locations/hooks/useLocationAuthoringGridLayout';
import { usePruneGridDraftOnDimensionChange } from '@/features/content/locations/hooks/usePruneGridDraftOnDimensionChange';
import {
  LocationGridAuthoringHexMapPathOverlayLayer,
  LocationGridAuthoringHexMapPlacedObjectsOverlayLayer,
  LocationGridAuthoringHexMapRegionOverlayLayer,
  LocationGridAuthoringSquareMapOverlayLayer,
  LocationGridAuthoringSquareMapPlacedObjectsOverlayLayer,
  LocationGridAuthoringSquareTerrainLayer,
} from './locationGridAuthoringMapOverlayLayers';
import { MAP_AUTHORING_LAYER_Z } from './mapAuthoringLayerZ';
import { useSquareEdgeBoundaryPaint } from '../mapGrid/authoring/useSquareEdgeBoundaryPaint';
import { LocationMapCellAuthoringOverlay } from '../mapGrid/LocationMapCellAuthoringOverlay';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/model/map/locationEdgeFeature.types';

import type { LocationGridDraftState } from '../authoring/draft/locationGridDraft.types';
import { selectedCellIdForMapSelection } from './rightRail/locationEditorRail.helpers';
import { SQUARE_GRID_GAP_PX } from '../authoring/geometry/squareGridMapOverlayGeometry';
import { edgeEntriesToSegmentGeometrySquare } from '@/shared/domain/locations/map/locationMapEdgeGeometry.helpers';
import { pathEntriesToPolylineGeometry } from '@/shared/domain/locations/map/locationMapPathPolyline.helpers';
import { resolveNearestHexCell } from '../authoring/geometry/hexGridMapOverlayGeometry';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import { buildHexAuthoringRegionBoundarySegments } from './locationGridAuthoringHexRegionOverlays';
import { buildLocationGridPathSvgPreviewData } from './locationGridAuthoringPathSvgPreview';
import { deriveLocationMapAuthoredObjectRenderItemsFromObjectsByCellId } from '@/shared/domain/locations/map/locationMapAuthoredObjectRender.helpers';
import { buildPlacedObjectGeometryLayoutContextFromAuthoring } from '@/shared/domain/locations/map/placedObjectGeometryLayoutContext';
import { useLocationGridAuthoringCellPointers } from './useLocationGridAuthoringCellPointers';
import { useLocationGridPaintStroke } from './useLocationGridPaintStroke';
import { useLocationGridSelectMode } from './useLocationGridSelectMode';

type LocationGridAuthoringSectionProps = {
  gridColumns: string;
  gridRows: string;
  /** Form field `gridCellUnit` — drives Phase 3 footprint layout with square {@link squareGridGeometry}. */
  gridCellUnit?: string;
  gridGeometry?: GridGeometryId | string;
  draft: LocationGridDraftState;
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  /** Campaign locations (for cell rail link picker). */
  locations: Location[];
  campaignId?: string;
  /** Current location being edited; omit on create. */
  hostLocationId?: string;
  hostScale: string;
  hostName?: string;
  /** Switch right rail to Cell tab when user selects a cell. */
  onCellFocusRail?: () => void;
  /** Map editor tool mode; default select. */
  mapEditorMode?: LocationMapEditorMode;
  /** Place palette selection (for cell-object hover preview in place mode). */
  activePlace?: LocationMapActivePlaceSelection;
  /** Active paint swatch when mode is paint. */
  activePaint?: LocationMapActivePaintSelection;
  /** Extra left inset (e.g. vertical toolbar width). */
  leftChromeWidthPx?: number;
  /** Place mode: user clicked a cell to attempt placement. */
  onPlaceCellClick?: (cellId: string) => void;
  /** Erase mode: remove highest-priority feature at cell (edge → object → path → link). */
  onEraseCellClick?: (cellId: string) => void;
  /** Place mode: first cell chosen for path segment (two-click flow). */
  placePathAnchorCellId?: string | null;
  /** Active draw-palette selection (paths / edges). */
  activeDraw?: LocationMapActiveDrawSelection;
  /** Edge boundary-paint: commit a stroke of edge IDs. */
  onEdgeStrokeCommit?: (edgeIds: string[], edgeKind: LocationEdgeFeatureKindId) => void;
  /** Erase a specific edge feature by canonical edgeId. */
  onEraseEdge?: (edgeId: string) => void;
  /** Place tool: `placementMode: 'edge'` — boundary click commits via {@link onEdgeStrokeCommit} with this kind. */
  placeEdgeAuthoringActive?: boolean;
  placeEdgeFeatureKind?: LocationEdgeFeatureKindId | null;
  /**
   * When true with place mode, cell pointer events stop propagation so the map canvas
   * does not pan (same idea as paint / erase-fill strokes).
   */
  suppressCanvasPanOnCells?: boolean;
  /**
   * When true, **object** placement uses pointer drag (down + enter) like paint so dragging
   * across cells places on each cell. Path / edge / link still use click-only flows.
   */
  placeObjectDragStrokeEnabled?: boolean;
  /** When drag-place ends (pointer up), e.g. focus Selection rail without switching on each cell. */
  onPlaceObjectStrokeEnd?: () => void;
  /** From {@link useCanvasPan#consumeClickSuppressionAfterPan}; skip cell click after pan drag. */
  consumeClickSuppressionAfterPan?: () => boolean;
  /** Paint mode region strokes: create/extend via workspace (draft + selection + rail). */
  onRegionPaintCell?: (cellId: string) => void;
};

export function LocationGridAuthoringSection({
  gridColumns,
  gridRows,
  gridCellUnit,
  gridGeometry = 'square',
  draft,
  setDraft,
  locations,
  campaignId,
  hostLocationId,
  hostScale,
  hostName,
  onCellFocusRail,
  mapEditorMode = 'select',
  activePlace = null,
  activePaint = null,
  leftChromeWidthPx = 0,
  onPlaceCellClick,
  onEraseCellClick,
  placePathAnchorCellId = null,
  activeDraw = null,
  onEdgeStrokeCommit,
  onEraseEdge,
  placeEdgeAuthoringActive = false,
  placeEdgeFeatureKind = null,
  suppressCanvasPanOnCells = false,
  placeObjectDragStrokeEnabled = false,
  onPlaceObjectStrokeEnd,
  consumeClickSuppressionAfterPan,
  onRegionPaintCell,
}: LocationGridAuthoringSectionProps) {
  void campaignId;
  void hostLocationId;
  void hostName;
  const theme = useTheme();
  const [placeHoverCellId, setPlaceHoverCellId] = useState<string | null>(null);
  const [squareAuthoringHoverCellId, setSquareAuthoringHoverCellId] = useState<string | null>(null);
  const cols = Number(gridColumns);
  const rows = Number(gridRows);
  const validPreview = useMemo(
    () =>
      Number.isInteger(cols) &&
      cols > 0 &&
      Number.isInteger(rows) &&
      rows > 0,
    [cols, rows],
  );

  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  const edgePlaceActive = mapEditorMode === 'draw' && activeDraw?.category === 'edge';
  const edgeEraseActive = mapEditorMode === 'erase';

  usePruneGridDraftOnDimensionChange(validPreview, cols, rows, setDraft);

  useEffect(() => {
    if (!placePathAnchorCellId) {
      setPlaceHoverCellId(null);
    }
  }, [placePathAnchorCellId]);

  const isHex = gridGeometry === 'hex';
  const { gridSizePx, squareGridGeometry, hexGridGeometry, cellCenterPx } =
    useLocationAuthoringGridLayout(validPreview, cols, rows, isHex, leftChromeWidthPx);

  const {
    edgeHoverTarget,
    edgeStrokeSnapshot,
    edgeStrokeActive,
    commitEdgeStroke,
    handleEdgePointerDown,
    handleEdgePointerMove,
    handleEdgePointerUp,
    handleEdgePointerLeave,
  } = useSquareEdgeBoundaryPaint({
    gridContainerRef,
    squareGridGeometry,
    cols,
    rows,
    edgePlaceActive,
    placeEdgeAuthoringActive,
    placeEdgeKind: placeEdgeFeatureKind,
    edgeEraseActive,
    activeDraw,
    onEdgeStrokeCommit,
    onEraseEdge,
  });

  const pathPickPolys = useMemo(() => {
    return pathEntriesToPolylineGeometry(draft.pathEntries, (cid) => cellCenterPx(cid));
  }, [draft.pathEntries, cellCenterPx]);

  const edgePickGeoms = useMemo(() => {
    if (!squareGridGeometry || isHex) return null;
    return edgeEntriesToSegmentGeometrySquare(
      draft.edgeEntries,
      squareGridGeometry.cellPx,
      SQUARE_GRID_GAP_PX,
    );
  }, [draft.edgeEntries, squareGridGeometry, isHex]);

  const resolveHexCellFromClient = useCallback(
    (clientX: number, clientY: number): string | null => {
      if (!isHex || !gridContainerRef.current || !hexGridGeometry) return null;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = clientX - rect.left;
      const gy = clientY - rect.top;
      return resolveNearestHexCell(gx, gy, cols, rows, hexGridGeometry.hexSize);
    },
    [isHex, hexGridGeometry, cols, rows],
  );

  const {
    selectHoverTarget,
    clearSelectHoverTarget,
    handleSelectPointerMove,
    handleSelectGridContainerClick,
    onSelectModeCellClick,
  } = useLocationGridSelectMode({
    mapEditorMode,
    validPreview,
    draft,
    setDraft,
    pathPickPolys,
    edgePickGeoms,
    isHex,
    squareGridGeometry,
    cols,
    rows,
    gridContainerRef,
    resolveHexCellFromClient,
    consumeClickSuppressionAfterPan,
    onCellFocusRail,
  });

  const hexSelectedRegionBoundarySegments = useMemo(
    () =>
      buildHexAuthoringRegionBoundarySegments({
        isHex,
        hexGridGeometry,
        cols,
        rows,
        activeRegionId:
          draft.mapSelection.type === 'region' ? draft.mapSelection.regionId : null,
        regionIdByCellId: draft.regionIdByCellId,
      }),
    [isHex, hexGridGeometry, draft.mapSelection, draft.regionIdByCellId, cols, rows],
  );

  const hexHoverRegionBoundarySegments = useMemo(
    () =>
      buildHexAuthoringRegionBoundarySegments({
        isHex,
        hexGridGeometry,
        cols,
        rows,
        activeRegionId:
          selectHoverTarget.type === 'region' ? selectHoverTarget.regionId : null,
        regionIdByCellId: draft.regionIdByCellId,
      }),
    [isHex, hexGridGeometry, selectHoverTarget, draft.regionIdByCellId, cols, rows],
  );

  const activePathKind: LocationMapPathKindId | null =
    activeDraw?.category === 'path' ? activeDraw.kind : null;

  const pathSvgData = useMemo(
    () =>
      buildLocationGridPathSvgPreviewData({
        pathEntries: draft.pathEntries,
        placePathAnchorCellId,
        placeHoverCellId,
        cellCenterPx,
        gridGeometry,
        cols,
        rows,
        activePathKind,
      }),
    [
      draft.pathEntries,
      placePathAnchorCellId,
      placeHoverCellId,
      cellCenterPx,
      gridGeometry,
      cols,
      rows,
      activePathKind,
    ],
  );

  /** Committed edge features (square grid only): shared geometry layer → SVG lines below. */
  const committedEdgeSegmentGeometry = useMemo(() => {
    if (!squareGridGeometry || isHex) return [];
    return edgeEntriesToSegmentGeometrySquare(
      draft.edgeEntries,
      squareGridGeometry.cellPx,
      SQUARE_GRID_GAP_PX,
    );
  }, [draft.edgeEntries, squareGridGeometry, isHex]);

  const mapUi = useMemo(() => resolveLocationMapUiStyles(theme), [theme]);


  const locationById = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations],
  );

  const pathEndpointCells = useMemo(() => {
    const s = new Set<string>();
    for (const pe of draft.pathEntries) {
      for (const cid of pe.cellIds) {
        s.add(cid.trim());
      }
    }
    return s;
  }, [draft.pathEntries]);

  const getCellClassName = useCallback(
    (cell: GridCell) => {
      const id = cell.cellId;
      if (placePathAnchorCellId && id === placePathAnchorCellId) {
        return 'location-map-place-anchor-path';
      }
      if (placeHoverCellId && id === placeHoverCellId) {
        return 'location-map-place-hover-preview';
      }
      if (pathEndpointCells.has(id)) return 'location-map-path-endpoint';
      return undefined;
    },
    [placePathAnchorCellId, placeHoverCellId, pathEndpointCells],
  );

  const getCellFillPresentation = useCallback(
    (cell: GridCell) => {
      const sel = draft.cellFillByCellId[cell.cellId];
      if (!sel) return undefined;
      return resolveCellFillPresentation(sel.familyId, sel.variantId);
    },
    [draft.cellFillByCellId],
  );

  const {
    paintStrokeActive,
    endPaintStroke,
    handlePaintPointerDown,
    handlePaintPointerEnter,
    handlePaintPointerUp,
  } = useLocationGridPaintStroke({
    mapEditorMode,
    activePaint,
    regionEntries: draft.regionEntries,
    setDraft,
    onRegionPaintCell,
  });

  const paintStrokeOrEraseFill =
    mapEditorMode === 'paint' || mapEditorMode === 'erase';

  const suppressEdgePlacePan =
    suppressCanvasPanOnCells &&
    (mapEditorMode === 'place' ||
      (mapEditorMode === 'draw' && activeDraw?.category === 'path'));

  const placeCellClickSuppressedForEdgeTool = placeEdgeAuthoringActive;

  const placeObjectStrokeMode =
    placeObjectDragStrokeEnabled && mapEditorMode === 'place';

  const placePathPlacement =
    mapEditorMode === 'draw' &&
    activeDraw?.category === 'path' &&
    !placeObjectStrokeMode &&
    placePathAnchorCellId != null;

  const placeMapObjectCellHover = useMemo(() => {
    if (mapEditorMode !== 'place') return false;
    if (
      !activePlace ||
      (activePlace.category !== 'map-object' && activePlace.category !== 'linked-content')
    ) {
      return false;
    }
    if (getPlacementModeForFamily(activePlace.kind) !== 'cell') return false;
    if (placeEdgeAuthoringActive) return false;
    return true;
  }, [mapEditorMode, activePlace, placeEdgeAuthoringActive]);

  const placePreviewItem = useMemo(
    () =>
      placeMapObjectCellHover
        ? buildPlacePreviewRenderItem(activePlace, placeHoverCellId, hostScale as LocationScaleId)
        : null,
    [placeMapObjectCellHover, activePlace, placeHoverCellId, hostScale],
  );

  const {
    placeObjectStrokeActive,
    endPlaceObjectStroke,
    handleCellPointerDownForGrid,
    handleCellPointerEnterForGrid,
    handleCellPointerUpForGrid,
    handlePlacePathEdgePointerMove,
    updatePlaceHoverFromPointerClient,
  } = useLocationGridAuthoringCellPointers({
    paintStrokeOrEraseFill,
    handlePaintPointerDown,
    handlePaintPointerEnter,
    handlePaintPointerUp,
    placeObjectStrokeMode,
    placePathPlacement,
    suppressEdgePlacePan: suppressEdgePlacePan || placeCellClickSuppressedForEdgeTool,
    onPlaceCellClick,
    onPlaceObjectStrokeEnd,
    resolveHexCellFromClient,
    setPlaceHoverCellId,
  });

  useEffect(() => {
    const onWindowPointerUp = () => {
      if (paintStrokeActive.current) endPaintStroke();
      if (placeObjectStrokeActive.current) endPlaceObjectStroke();
      if (edgeStrokeActive.current) commitEdgeStroke();
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [endPaintStroke, endPlaceObjectStroke, commitEdgeStroke, edgeStrokeActive]);

  const onCellClick = (cell: GridCell, e: ReactMouseEvent<HTMLElement>) => {
    if (consumeClickSuppressionAfterPan?.()) return;
    if (mapEditorMode === 'place') {
      if (placeObjectStrokeMode) return;
      if (placeEdgeAuthoringActive) return;
      onPlaceCellClick?.(cell.cellId);
      return;
    }
    if (mapEditorMode === 'draw' && activeDraw?.category === 'path') {
      if (placeObjectStrokeMode) return;
      onPlaceCellClick?.(cell.cellId);
      return;
    }
    if (mapEditorMode === 'erase') {
      onEraseCellClick?.(cell.cellId);
      return;
    }
    if (mapEditorMode === 'paint') {
      return;
    }
    if (mapEditorMode !== 'select') {
      return;
    }
    onSelectModeCellClick(cell, e);
  };

  const handleHexFallbackClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isHex || edgePlaceActive || placeEdgeAuthoringActive || placeObjectStrokeMode) return;
      const hexGapPlaceOrPath =
        mapEditorMode === 'place' ||
        (mapEditorMode === 'draw' && activeDraw?.category === 'path');
      if (!hexGapPlaceOrPath) return;
      if (consumeClickSuppressionAfterPan?.()) return;
      const target = e.target as HTMLElement;
      if (target.closest('[role="gridcell"]')) return;
      const cellId = resolveHexCellFromClient(e.clientX, e.clientY);
      if (cellId) onPlaceCellClick?.(cellId);
    },
    [
      isHex,
      mapEditorMode,
      activeDraw,
      edgePlaceActive,
      placeEdgeAuthoringActive,
      placeObjectStrokeMode,
      consumeClickSuppressionAfterPan,
      resolveHexCellFromClient,
      onPlaceCellClick,
    ],
  );

  const globalPlacedObjectRenderItems = useMemo(() => {
    const base = deriveLocationMapAuthoredObjectRenderItemsFromObjectsByCellId(draft.objectsByCellId);
    return placePreviewItem ? [...base, placePreviewItem] : base;
  }, [draft.objectsByCellId, placePreviewItem]);

  const squarePlacedObjectFootprintLayout = useMemo(
    () =>
      buildPlacedObjectGeometryLayoutContextFromAuthoring({
        gridKind: 'square',
        gridCellUnit,
        squareCellPx: squareGridGeometry?.cellPx,
      }),
    [gridCellUnit, squareGridGeometry?.cellPx],
  );

  const renderMapCellIcons = (cell: GridCell) => (
    <LocationMapCellAuthoringOverlay
      cell={cell}
      draft={draft}
      selectHoverTarget={selectHoverTarget}
      isHex={isHex}
      mapUi={mapUi}
      locationById={locationById}
      gridCellUnit={gridCellUnit}
      squareCellPx={!isHex ? squareGridGeometry?.cellPx : undefined}
      placePreviewItem={placePreviewItem}
      suppressPlacedObjectGlyphs={isHex || globalPlacedObjectRenderItems.length > 0}
    />
  );

  const mapToolCrosshair =
    mapEditorMode === 'place' ||
    mapEditorMode === 'draw' ||
    mapEditorMode === 'erase' ||
    mapEditorMode === 'paint';

  const sharedGridProps = {
    columns: cols,
    rows: rows,
    selectedCellId: selectedCellIdForMapSelection(draft.mapSelection),
    excludedCellIds: draft.excludedCellIds,
    onCellClick,
    getCellFillPresentation,
    onCellPointerDown:
      paintStrokeOrEraseFill ||
      placeObjectStrokeMode ||
      placePathPlacement ||
      suppressEdgePlacePan
        ? handleCellPointerDownForGrid
        : undefined,
    onCellPointerEnter:
      paintStrokeOrEraseFill || placeObjectStrokeMode || placePathPlacement
        ? handleCellPointerEnterForGrid
        : undefined,
    onCellPointerUp:
      paintStrokeOrEraseFill ||
      placeObjectStrokeMode ||
      placePathPlacement ||
      suppressEdgePlacePan
        ? handleCellPointerUpForGrid
        : undefined,
    renderCellContent: renderMapCellIcons,
    getCellClassName,
    selectHoverTarget:
      mapEditorMode === 'select' ? selectHoverTarget : undefined,
  };

  if (!validPreview) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        ...(mapToolCrosshair
          ? {
              '& [role="gridcell"]': {
                cursor: 'crosshair',
              },
            }
          : {}),
        ...(mapEditorMode === 'select'
          ? {
              '& [role="gridcell"]': {
                cursor: 'default',
              },
            }
          : {}),
        '& .location-map-place-anchor-path': {
          boxShadow: `inset 0 0 0 ${mapUi.cell.placeAnchorOutlinePx}px ${colorPrimitives.blue[400]}`,
        },
        '& .location-map-path-endpoint': {
          boxShadow: `inset 0 0 0 ${mapUi.cell.pathEndpointOutlinePx}px ${colorPrimitives.blue[300]}`,
        },
        '& .location-map-place-hover-preview': {
          boxShadow: `inset 0 0 0 ${mapUi.cell.placeHoverPreviewOutlinePx}px ${colorPrimitives.green[300]}`,
        },
      }}
    >
      {isHex && draft.edgeEntries.length > 0 ? (
        <Alert severity="info" sx={{ mb: 1 }} variant="outlined">
          This hex map has {draft.edgeEntries.length} stored edge segment
          {draft.edgeEntries.length === 1 ? '' : 's'} (walls / windows / doors). Hex grids do not
          show or edit boundary edges yet; data is kept when you save. Use a square grid to view or
          change edges.
        </Alert>
      ) : null}
      <Box
        ref={gridContainerRef}
        sx={{
          position: 'relative',
          width: gridSizePx.width,
          ...((edgePlaceActive || edgeEraseActive || placeEdgeAuthoringActive) ? {
            cursor: 'crosshair',
            '& *': { cursor: 'crosshair !important' },
          } : {}),
        }}
        onClick={
          isHex
            ? handleHexFallbackClick
            : mapEditorMode === 'select'
              ? handleSelectGridContainerClick
              : undefined
        }
        onPointerDownCapture={
          edgePlaceActive || edgeEraseActive || placeEdgeAuthoringActive ? handleEdgePointerDown : undefined
        }
        onPointerMoveCapture={
          edgePlaceActive || edgeEraseActive || placeEdgeAuthoringActive ? handleEdgePointerMove : undefined
        }
        onPointerUpCapture={
          edgePlaceActive || placeEdgeAuthoringActive ? handleEdgePointerUp : undefined
        }
        onPointerMove={(e) => {
          if (placePathPlacement) handlePlacePathEdgePointerMove(e);
          if (placeMapObjectCellHover) updatePlaceHoverFromPointerClient(e.clientX, e.clientY);
          if (mapEditorMode === 'select' && validPreview) handleSelectPointerMove(e);
        }}
        onPointerLeave={() => {
          if (edgePlaceActive || edgeEraseActive || placeEdgeAuthoringActive) handleEdgePointerLeave();
          if (placePathPlacement || placeMapObjectCellHover) setPlaceHoverCellId(null);
          if (mapEditorMode === 'select') clearSelectHoverTarget();
        }}
      >
        <LocationGridAuthoringSquareTerrainLayer
          visible={!!squareGridGeometry && !isHex}
          squareGridGeometry={squareGridGeometry}
          columns={cols}
          rows={rows}
          getCellFillPresentation={getCellFillPresentation}
          selectedCellId={sharedGridProps.selectedCellId}
          excludedCellIds={draft.excludedCellIds}
          selectHoverTarget={
            mapEditorMode === 'select' ? selectHoverTarget : undefined
          }
          pointerHoverCellId={squareAuthoringHoverCellId}
        />
        <LocationGridAuthoringSquareMapOverlayLayer
          visible={
            !!squareGridGeometry &&
            !isHex &&
            (pathSvgData.length > 0 ||
              draft.edgeEntries.length > 0 ||
              edgeHoverTarget != null ||
              edgeStrokeSnapshot.length > 0)
          }
          squareGridGeometry={squareGridGeometry}
          mapUi={mapUi}
          hostScale={hostScale}
          pathSvgData={pathSvgData}
          mapSelection={draft.mapSelection}
          selectHoverTarget={selectHoverTarget}
          edgeStrokeSnapshot={edgeStrokeSnapshot}
          edgeHoverTarget={edgeHoverTarget}
          edgeEraseActive={edgeEraseActive}
          committedEdgeSegmentGeometry={committedEdgeSegmentGeometry}
        />
        <LocationGridAuthoringHexMapPathOverlayLayer
          visible={!!hexGridGeometry && isHex && pathSvgData.length > 0}
          hexGridGeometry={hexGridGeometry}
          mapUi={mapUi}
          hostScale={hostScale}
          pathSvgData={pathSvgData}
          mapSelection={draft.mapSelection}
          selectHoverTarget={selectHoverTarget}
        />
        <Box sx={{ position: 'relative', zIndex: MAP_AUTHORING_LAYER_Z.cellGrid }}>
          {isHex ? (
            <HexGridEditor
              {...sharedGridProps}
              hexSize={gridSizePx.hexCellPx || undefined}
            />
          ) : (
            <GridEditor
              {...sharedGridProps}
              selectModeCursor={mapEditorMode === 'select'}
              omitTerrainFill
              onAuthoringCellHoverChange={setSquareAuthoringHoverCellId}
            />
          )}
        </Box>
        <LocationGridAuthoringSquareMapPlacedObjectsOverlayLayer
          visible={
            !!squareGridGeometry &&
            !isHex &&
            globalPlacedObjectRenderItems.length > 0
          }
          squareGridGeometry={squareGridGeometry}
          mapUi={mapUi}
          selectHoverTarget={selectHoverTarget}
          items={globalPlacedObjectRenderItems}
          cellPx={squareGridGeometry?.cellPx ?? 0}
          gapPx={SQUARE_GRID_GAP_PX}
          footprintLayout={squarePlacedObjectFootprintLayout}
        />
        <LocationGridAuthoringHexMapPlacedObjectsOverlayLayer
          visible={!!hexGridGeometry && isHex && globalPlacedObjectRenderItems.length > 0}
          hexGridGeometry={hexGridGeometry}
          mapUi={mapUi}
          selectHoverTarget={selectHoverTarget}
          items={globalPlacedObjectRenderItems}
          hexSize={gridSizePx.hexCellPx ?? 48}
        />
        <LocationGridAuthoringHexMapRegionOverlayLayer
          visible={
            !!hexGridGeometry &&
            isHex &&
            (hexSelectedRegionBoundarySegments.length > 0 || hexHoverRegionBoundarySegments.length > 0)
          }
          hexGridGeometry={hexGridGeometry}
          mapUi={mapUi}
          mapSelection={draft.mapSelection}
          selectHoverTarget={selectHoverTarget}
          hexSelectedRegionBoundarySegments={hexSelectedRegionBoundarySegments}
          hexHoverRegionBoundarySegments={hexHoverRegionBoundarySegments}
        />
      </Box>
    </Paper>
  );
}
