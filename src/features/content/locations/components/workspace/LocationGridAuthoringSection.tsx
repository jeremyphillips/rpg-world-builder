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
import type { PointerEvent as ReactPointerEvent } from 'react';
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
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import { LOCATION_CELL_FILL_KIND_META } from '@/features/content/locations/domain/model/map/locationCellFill.types';
import {
  buildSelectModeInteractiveTargetInput,
  buildSelectModeInteractiveTargetInputSkipGeometry,
  canApplyAnyPaintStroke,
  canApplyRegionPaint,
  getActiveSurfaceFillKind,
  refineSelectModeClickAfterRegionDrill,
  resolveSelectModeInteractiveTarget,
  type LocationMapActiveDrawSelection,
  type LocationMapActivePaintSelection,
  type LocationMapEditorMode,
} from '@/features/content/locations/domain/authoring/editor';
import { colorPrimitives } from '@/app/theme/colorPrimitives';
import { resolveCellFillSwatchColor } from '@/app/theme/mapColors';
import { resolveLocationMapUiStyles } from '@/features/content/locations/domain/presentation/map/locationMapUiStyles';
import type { Location } from '@/features/content/locations/domain/model/location';
import { useLocationAuthoringGridLayout } from '@/features/content/locations/hooks/useLocationAuthoringGridLayout';
import { usePruneGridDraftOnDimensionChange } from '@/features/content/locations/hooks/usePruneGridDraftOnDimensionChange';
import { hexBoundarySegmentsForRegionCells } from '../authoring/geometry/hexRegionBoundaryForAuthoring';
import { HexMapAuthoringSvgOverlay } from '../mapGrid/authoring/HexMapAuthoringSvgOverlay';
import { SquareMapAuthoringSvgOverlay } from '../mapGrid/authoring/SquareMapAuthoringSvgOverlay';
import { useSquareEdgeBoundaryPaint } from '../mapGrid/authoring/useSquareEdgeBoundaryPaint';
import { LocationMapCellAuthoringOverlay } from '../mapGrid/LocationMapCellAuthoringOverlay';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/model/map/locationEdgeFeature.types';

import type { LocationGridDraftState } from '../authoring/draft/locationGridDraft.types';
import {
  mapSelectionEqual,
  selectedCellIdForMapSelection,
  type LocationMapSelection,
} from './rightRail/types';
import {
  resolveSquareAnchorCellIdForSelectPx,
  SQUARE_GRID_GAP_PX,
} from '../authoring/geometry/squareGridMapOverlayGeometry';
import { edgeEntriesToSegmentGeometrySquare } from '@/shared/domain/locations/map/locationMapEdgeGeometry.helpers';
import {
  pathEntriesToPolylineGeometry,
  pathEntryToPolylineGeometry,
} from '@/shared/domain/locations/map/locationMapPathPolyline.helpers';
import { resolveNearestHexCell } from '../authoring/geometry/hexGridMapOverlayGeometry';
import { polylinePoint2DToSmoothSvgPath } from '../authoring/geometry/pathOverlayRendering';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import { getNeighborPoints } from '@/shared/domain/grid/gridHelpers';

type LocationGridAuthoringSectionProps = {
  gridColumns: string;
  gridRows: string;
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
  /** From {@link useCanvasPan#consumeClickSuppressionAfterPan}; skip cell click after pan drag. */
  consumeClickSuppressionAfterPan?: () => boolean;
};

export function LocationGridAuthoringSection({
  gridColumns,
  gridRows,
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
  activePaint = null,
  leftChromeWidthPx = 0,
  onPlaceCellClick,
  onEraseCellClick,
  placePathAnchorCellId = null,
  activeDraw = null,
  onEdgeStrokeCommit,
  onEraseEdge,
  suppressCanvasPanOnCells = false,
  placeObjectDragStrokeEnabled = false,
  consumeClickSuppressionAfterPan,
}: LocationGridAuthoringSectionProps) {
  void campaignId;
  void hostLocationId;
  void hostScale;
  void hostName;
  const theme = useTheme();
  const [placeHoverCellId, setPlaceHoverCellId] = useState<string | null>(null);
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

  const paintStrokeActive = useRef(false);
  const strokeSeen = useRef<Set<string>>(new Set());
  const placeObjectStrokeActive = useRef(false);
  const placeObjectStrokeSeen = useRef<Set<string>>(new Set());

  const [selectHoverTarget, setSelectHoverTarget] = useState<LocationMapSelection>({
    type: 'none',
  });
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mapEditorMode !== 'select') {
      setSelectHoverTarget({ type: 'none' });
    }
  }, [mapEditorMode]);

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
    edgeEraseActive,
    activeDraw,
    onEdgeStrokeCommit,
    onEraseEdge,
  });

  const hexSelectedRegionBoundarySegments = useMemo(() => {
    if (!isHex || !hexGridGeometry || draft.mapSelection.type !== 'region') {
      return [];
    }
    return hexBoundarySegmentsForRegionCells(
      cols,
      rows,
      hexGridGeometry.hexSize,
      draft.mapSelection.regionId,
      draft.regionIdByCellId,
    );
  }, [isHex, hexGridGeometry, draft.mapSelection, draft.regionIdByCellId, cols, rows]);

  const hexHoverRegionBoundarySegments = useMemo(() => {
    if (!isHex || !hexGridGeometry || selectHoverTarget.type !== 'region') {
      return [];
    }
    return hexBoundarySegmentsForRegionCells(
      cols,
      rows,
      hexGridGeometry.hexSize,
      selectHoverTarget.regionId,
      draft.regionIdByCellId,
    );
  }, [isHex, hexGridGeometry, selectHoverTarget, draft.regionIdByCellId, cols, rows]);

  const activePathKind: LocationMapPathKindId | null =
    activeDraw?.category === 'path' ? activeDraw.kind : null;

  const pathSvgData = useMemo(() => {
    const chains = draft.pathEntries.map((pe) => ({
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
    const result: { pathId: string; kind: LocationMapPathKindId; d: string }[] = [];

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
  }, [draft.pathEntries, placePathAnchorCellId, placeHoverCellId, cellCenterPx, gridGeometry, cols, rows, activePathKind]);

  /** Committed edge features (square grid only): shared geometry layer → SVG lines below. */
  const committedEdgeSegmentGeometry = useMemo(() => {
    if (!squareGridGeometry || isHex) return [];
    return edgeEntriesToSegmentGeometrySquare(
      draft.edgeEntries,
      squareGridGeometry.cellPx,
      SQUARE_GRID_GAP_PX,
    );
  }, [draft.edgeEntries, squareGridGeometry, isHex]);

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

  const getCellBackgroundColor = useCallback(
    (cell: GridCell) => {
      const kind = draft.cellFillByCellId[cell.cellId];
      if (!kind) return undefined;
      const meta = LOCATION_CELL_FILL_KIND_META[kind];
      return resolveCellFillSwatchColor(meta);
    },
    [draft.cellFillByCellId],
  );

  const applyStrokeCell = useCallback(
    (cellId: string) => {
      if (strokeSeen.current.has(cellId)) return;
      strokeSeen.current.add(cellId);
      if (mapEditorMode === 'paint') {
        const surfaceFill = getActiveSurfaceFillKind(activePaint ?? null);
        if (surfaceFill) {
          setDraft((d) => ({
            ...d,
            cellFillByCellId: { ...d.cellFillByCellId, [cellId]: surfaceFill },
          }));
          return;
        }
        if (canApplyRegionPaint(activePaint ?? null, draft.regionEntries)) {
          const paint = activePaint!;
          const rid = paint.activeRegionId!.trim();
          setDraft((prevDraft) => ({
            ...prevDraft,
            regionIdByCellId: { ...prevDraft.regionIdByCellId, [cellId]: rid },
          }));
        }
        return;
      }
      if (mapEditorMode === 'erase') {
        setDraft((d) => {
          const nextFill = { ...d.cellFillByCellId };
          delete nextFill[cellId];
          const nextRegion = { ...d.regionIdByCellId };
          delete nextRegion[cellId];
          return { ...d, cellFillByCellId: nextFill, regionIdByCellId: nextRegion };
        });
      }
    },
    [activePaint, draft.regionEntries, mapEditorMode, setDraft],
  );

  const endPaintStroke = useCallback(() => {
    paintStrokeActive.current = false;
    strokeSeen.current.clear();
  }, []);

  const endPlaceObjectStroke = useCallback(() => {
    placeObjectStrokeActive.current = false;
    placeObjectStrokeSeen.current.clear();
  }, []);

  useEffect(() => {
    const onWindowPointerUp = () => {
      if (paintStrokeActive.current) endPaintStroke();
      if (placeObjectStrokeActive.current) endPlaceObjectStroke();
      if (edgeStrokeActive.current) commitEdgeStroke();
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [endPaintStroke, endPlaceObjectStroke, commitEdgeStroke, edgeStrokeActive]);

  const handlePaintPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (mapEditorMode !== 'paint' && mapEditorMode !== 'erase') return;
      if (mapEditorMode === 'paint' && !canApplyAnyPaintStroke(activePaint ?? null, draft.regionEntries)) {
        return;
      }
      e.stopPropagation();
      paintStrokeActive.current = true;
      strokeSeen.current = new Set();
      applyStrokeCell(cell.cellId);
    },
    [activePaint, applyStrokeCell, draft.regionEntries, mapEditorMode],
  );

  const handlePaintPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (!paintStrokeActive.current) return;
      if (e.buttons !== 1) return;
      if (mapEditorMode === 'paint' && !canApplyAnyPaintStroke(activePaint ?? null, draft.regionEntries)) {
        return;
      }
      e.stopPropagation();
      applyStrokeCell(cell.cellId);
    },
    [activePaint, applyStrokeCell, draft.regionEntries, mapEditorMode],
  );

  const handlePaintPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (mapEditorMode !== 'paint' && mapEditorMode !== 'erase') return;
      e.stopPropagation();
      endPaintStroke();
    },
    [endPaintStroke, mapEditorMode],
  );

  const paintStrokeOrEraseFill =
    mapEditorMode === 'paint' || mapEditorMode === 'erase';

  const suppressEdgePlacePan =
    suppressCanvasPanOnCells &&
    (mapEditorMode === 'place' ||
      (mapEditorMode === 'draw' && activeDraw?.category === 'path'));

  const placeObjectStrokeMode =
    placeObjectDragStrokeEnabled && mapEditorMode === 'place';

  const placePathPlacement =
    mapEditorMode === 'draw' &&
    activeDraw?.category === 'path' &&
    !placeObjectStrokeMode &&
    placePathAnchorCellId != null;

  const handleCellPointerDownForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (paintStrokeOrEraseFill) {
        handlePaintPointerDown(e, cell);
        return;
      }
      if (placeObjectStrokeMode) {
        e.stopPropagation();
        placeObjectStrokeActive.current = true;
        placeObjectStrokeSeen.current = new Set();
        if (!placeObjectStrokeSeen.current.has(cell.cellId)) {
          placeObjectStrokeSeen.current.add(cell.cellId);
          onPlaceCellClick?.(cell.cellId);
        }
        return;
      }
      if (placePathPlacement) {
        e.stopPropagation();
        return;
      }
      if (suppressEdgePlacePan) {
        e.stopPropagation();
      }
    },
    [
      paintStrokeOrEraseFill,
      handlePaintPointerDown,
      placeObjectStrokeMode,
      onPlaceCellClick,
      placePathPlacement,
      suppressEdgePlacePan,
    ],
  );

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

  const handleSelectPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (mapEditorMode !== 'select' || !validPreview) return;
      if (!gridContainerRef.current) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;
      const top = document.elementFromPoint(e.clientX, e.clientY);
      const cellEl = top?.closest('[role="gridcell"]');
      const anchorCellId =
        cellEl?.getAttribute('data-cell-id') ??
        resolveHexCellFromClient(e.clientX, e.clientY) ??
        (!isHex && squareGridGeometry
          ? resolveSquareAnchorCellIdForSelectPx(
              gx,
              gy,
              squareGridGeometry.cellPx,
              cols,
              rows,
              SQUARE_GRID_GAP_PX,
            )
          : null);
      if (!anchorCellId) {
        setSelectHoverTarget((prev) =>
          mapSelectionEqual(prev, { type: 'none' }) ? prev : { type: 'none' },
        );
        return;
      }
      const next = resolveSelectModeInteractiveTarget({
        targetElement: top as HTMLElement | null,
        clientX: e.clientX,
        clientY: e.clientY,
        gx,
        gy,
        anchorCellId,
        ...buildSelectModeInteractiveTargetInput(draft, pathPickPolys, edgePickGeoms, isHex),
      });
      setSelectHoverTarget((prev) => (mapSelectionEqual(prev, next) ? prev : next));
    },
    [
      mapEditorMode,
      validPreview,
      draft,
      pathPickPolys,
      edgePickGeoms,
      isHex,
      squareGridGeometry,
      cols,
      rows,
      resolveHexCellFromClient,
    ],
  );

  const handleSelectGridContainerClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (mapEditorMode !== 'select' || !validPreview) return;
      if (consumeClickSuppressionAfterPan?.()) return;
      if (isHex) return;
      if ((e.target as HTMLElement).closest('[role="gridcell"]')) return;
      if (!gridContainerRef.current || !squareGridGeometry) return;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = e.clientX - rect.left;
      const gy = e.clientY - rect.top;
      const anchorCellId = resolveSquareAnchorCellIdForSelectPx(
        gx,
        gy,
        squareGridGeometry.cellPx,
        cols,
        rows,
        SQUARE_GRID_GAP_PX,
      );
      if (!anchorCellId) return;
      setDraft((d) => {
        const resolved = resolveSelectModeInteractiveTarget({
          targetElement: e.target as HTMLElement,
          clientX: e.clientX,
          clientY: e.clientY,
          gx,
          gy,
          anchorCellId,
          ...buildSelectModeInteractiveTargetInput(d, pathPickPolys, edgePickGeoms, isHex),
        });
        const ms = refineSelectModeClickAfterRegionDrill(resolved, d.mapSelection, anchorCellId);
        return {
          ...d,
          mapSelection: ms,
          selectedCellId: selectedCellIdForMapSelection(ms),
        };
      });
      onCellFocusRail?.();
    },
    [
      mapEditorMode,
      validPreview,
      consumeClickSuppressionAfterPan,
      isHex,
      squareGridGeometry,
      cols,
      rows,
      pathPickPolys,
      edgePickGeoms,
      setDraft,
      onCellFocusRail,
    ],
  );

  const updatePlaceHoverFromPointerClient = useCallback(
    (clientX: number, clientY: number) => {
      const top = document.elementFromPoint(clientX, clientY);
      const cellEl = top?.closest('[role="gridcell"]');
      const directId = cellEl?.getAttribute('data-cell-id') ?? null;
      const next = directId ?? resolveHexCellFromClient(clientX, clientY);
      setPlaceHoverCellId((prev) => (prev === next ? prev : next));
    },
    [resolveHexCellFromClient],
  );

  const handlePlacePathEdgePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!placePathPlacement) return;
      updatePlaceHoverFromPointerClient(e.clientX, e.clientY);
    },
    [placePathPlacement, updatePlaceHoverFromPointerClient],
  );

  const handleCellPointerEnterForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (paintStrokeOrEraseFill) {
        handlePaintPointerEnter(e, cell);
        return;
      }
      if (placePathPlacement) {
        e.stopPropagation();
        setPlaceHoverCellId(cell.cellId);
        return;
      }
      if (!placeObjectStrokeActive.current || !placeObjectStrokeMode) return;
      if (e.buttons !== 1) return;
      e.stopPropagation();
      if (placeObjectStrokeSeen.current.has(cell.cellId)) return;
      placeObjectStrokeSeen.current.add(cell.cellId);
      onPlaceCellClick?.(cell.cellId);
    },
    [
      paintStrokeOrEraseFill,
      handlePaintPointerEnter,
      placePathPlacement,
      placeObjectStrokeMode,
      onPlaceCellClick,
    ],
  );

  const handleCellPointerUpForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      void cell;
      if (paintStrokeOrEraseFill) {
        handlePaintPointerUp(e);
        return;
      }
      if (placeObjectStrokeActive.current && placeObjectStrokeMode) {
        e.stopPropagation();
        endPlaceObjectStroke();
        return;
      }
      if (placePathPlacement) {
        e.stopPropagation();
        return;
      }
      if (suppressEdgePlacePan) {
        e.stopPropagation();
      }
    },
    [
      paintStrokeOrEraseFill,
      handlePaintPointerUp,
      placeObjectStrokeMode,
      endPlaceObjectStroke,
      placePathPlacement,
      suppressEdgePlacePan,
    ],
  );

  const onCellClick = (cell: GridCell, e: ReactMouseEvent<HTMLElement>) => {
    if (consumeClickSuppressionAfterPan?.()) return;
    if (mapEditorMode === 'place') {
      if (placeObjectStrokeMode) return;
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
    if (!gridContainerRef.current) {
      setDraft((d) => {
        const resolved = resolveSelectModeInteractiveTarget({
          targetElement: e.target as HTMLElement,
          clientX: e.clientX,
          clientY: e.clientY,
          gx: 0,
          gy: 0,
          anchorCellId: cell.cellId,
          ...buildSelectModeInteractiveTargetInputSkipGeometry(d, isHex),
        });
        const ms = refineSelectModeClickAfterRegionDrill(resolved, d.mapSelection, cell.cellId);
        return {
          ...d,
          mapSelection: ms,
          selectedCellId: selectedCellIdForMapSelection(ms),
        };
      });
      onCellFocusRail?.();
      return;
    }
    const rect = gridContainerRef.current.getBoundingClientRect();
    const gx = e.clientX - rect.left;
    const gy = e.clientY - rect.top;
    setDraft((d) => {
      const resolved = resolveSelectModeInteractiveTarget({
        targetElement: e.target as HTMLElement,
        clientX: e.clientX,
        clientY: e.clientY,
        gx,
        gy,
        anchorCellId: cell.cellId,
        ...buildSelectModeInteractiveTargetInput(d, pathPickPolys, edgePickGeoms, isHex),
      });
      const ms = refineSelectModeClickAfterRegionDrill(resolved, d.mapSelection, cell.cellId);
      return {
        ...d,
        mapSelection: ms,
        selectedCellId: selectedCellIdForMapSelection(ms),
      };
    });
    onCellFocusRail?.();
  };

  const handleHexFallbackClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isHex || edgePlaceActive || placeObjectStrokeMode) return;
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
      placeObjectStrokeMode,
      consumeClickSuppressionAfterPan,
      resolveHexCellFromClient,
      onPlaceCellClick,
    ],
  );

  const renderMapCellIcons = (cell: GridCell) => (
    <LocationMapCellAuthoringOverlay
      cell={cell}
      draft={draft}
      selectHoverTarget={selectHoverTarget}
      isHex={isHex}
      mapUi={mapUi}
      locationById={locationById}
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
    getCellBackgroundColor,
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
          ...((edgePlaceActive || edgeEraseActive) ? {
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
          edgePlaceActive || edgeEraseActive ? handleEdgePointerDown : undefined
        }
        onPointerMoveCapture={
          edgePlaceActive || edgeEraseActive ? handleEdgePointerMove : undefined
        }
        onPointerUpCapture={
          edgePlaceActive ? handleEdgePointerUp : undefined
        }
        onPointerMove={(e) => {
          if (placePathPlacement) handlePlacePathEdgePointerMove(e);
          if (mapEditorMode === 'select' && validPreview) handleSelectPointerMove(e);
        }}
        onPointerLeave={() => {
          if (edgePlaceActive || edgeEraseActive) handleEdgePointerLeave();
          if (placePathPlacement) setPlaceHoverCellId(null);
          if (mapEditorMode === 'select') setSelectHoverTarget({ type: 'none' });
        }}
      >
        {squareGridGeometry &&
        !isHex &&
        (pathSvgData.length > 0 ||
          draft.edgeEntries.length > 0 ||
          edgeHoverTarget != null ||
          edgeStrokeSnapshot.length > 0) ? (
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
              pathSvgData={pathSvgData}
              mapSelection={draft.mapSelection}
              selectHoverTarget={selectHoverTarget}
              edgeStrokeSnapshot={edgeStrokeSnapshot}
              edgeHoverTarget={edgeHoverTarget}
              edgeEraseActive={edgeEraseActive}
              committedEdgeSegmentGeometry={committedEdgeSegmentGeometry}
            />
          </Box>
        ) : null}
        {hexGridGeometry &&
        isHex &&
        (pathSvgData.length > 0 ||
          hexSelectedRegionBoundarySegments.length > 0 ||
          hexHoverRegionBoundarySegments.length > 0) ? (
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
              pathSvgData={pathSvgData}
              mapSelection={draft.mapSelection}
              selectHoverTarget={selectHoverTarget}
              hexSelectedRegionBoundarySegments={hexSelectedRegionBoundarySegments}
              hexHoverRegionBoundarySegments={hexHoverRegionBoundarySegments}
            />
          </Box>
        ) : null}
        <Box sx={{ position: 'relative', zIndex: 0 }}>
          {isHex ? (
            <HexGridEditor
              {...sharedGridProps}
              hexSize={gridSizePx.hexCellPx || undefined}
            />
          ) : (
            <GridEditor
              {...sharedGridProps}
              selectModeCursor={mapEditorMode === 'select'}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
