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
import { LOCATION_CELL_FILL_KIND_META } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapEditorMode,
} from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';
import {
  canApplyAnyPaintStroke,
  canApplyRegionPaint,
  getActiveSurfaceFillKind,
} from '@/features/content/locations/domain/mapEditor/locationMapPaintSelection.helpers';
import { resolveCellFillSwatchColor } from '@/app/theme/mapColors';
import { resolveLocationMapUiStyles } from '@/features/content/locations/domain/mapPresentation/locationMapUiStyles';
import type { Location } from '@/features/content/locations/domain/types';
import { useLocationAuthoringGridLayout } from '@/features/content/locations/hooks/useLocationAuthoringGridLayout';
import { usePruneGridDraftOnDimensionChange } from '@/features/content/locations/hooks/usePruneGridDraftOnDimensionChange';
import { hexBoundarySegmentsForRegionCells } from './hexRegionBoundaryForAuthoring';
import { LocationMapCellAuthoringOverlay } from './mapGrid/LocationMapCellAuthoringOverlay';
import { LocationMapPathSvgPaths } from './mapGrid/LocationMapPathSvgPaths';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import {
  resolveEdgeTargetFromGridPosition,
  shouldAcceptStrokeEdge,
  getSquareEdgeOrientation,
  type ResolvedEdgeTarget,
  type EdgeOrientation,
} from '@/features/content/locations/domain/mapEditor/edgeAuthoring';
import { refineSelectModeClickAfterRegionDrill } from '@/features/content/locations/domain/mapEditor/refineSelectModeClickAfterRegionDrill';
import { resolveSelectModeInteractiveTarget } from '@/features/content/locations/domain/mapEditor/resolveSelectModeInteractiveTarget';

import type { LocationGridDraftState } from './locationGridDraft.types';
import {
  mapSelectionEqual,
  selectedCellIdForMapSelection,
  type LocationMapSelection,
} from './workspace/locationEditorRail.types';
import {
  resolveSquareCellIdFromGridLocalPx,
  SQUARE_GRID_GAP_PX,
  squareEdgeSegmentPxFromEdgeId,
} from './squareGridMapOverlayGeometry';
import { edgeEntriesToSegmentGeometrySquare } from '@/shared/domain/locations/map/locationMapEdgeGeometry.helpers';
import {
  pathEntriesToPolylineGeometry,
  pathEntryToPolylineGeometry,
} from '@/shared/domain/locations/map/locationMapPathPolyline.helpers';
import { resolveNearestHexCell } from './hexGridMapOverlayGeometry';
import { polylinePoint2DToSmoothSvgPath } from './pathOverlayRendering';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import { getNeighborPoints } from '@/shared/domain/grid/gridHelpers';

const GRID_GAP_PX = SQUARE_GRID_GAP_PX; // MUI spacing(0.5) — matches GridEditor gap

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
  /** When provided, cell clicks are suppressed if a canvas drag gesture is active. */
  hasDragMoved?: () => boolean;
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
  hasDragMoved,
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

  // Edge boundary-paint state
  const [edgeHoverTarget, setEdgeHoverTarget] = useState<ResolvedEdgeTarget | null>(null);
  const edgeStrokeActive = useRef(false);
  const edgeStrokeSeen = useRef<Set<string>>(new Set());
  const edgeStrokeEdgeIds = useRef<string[]>([]);
  const [edgeStrokeSnapshot, setEdgeStrokeSnapshot] = useState<string[]>([]);
  const [selectHoverTarget, setSelectHoverTarget] = useState<LocationMapSelection>({
    type: 'none',
  });
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const edgeStrokeLockedAxis = useRef<EdgeOrientation | null>(null);
  const edgeStrokeLastTarget = useRef<ResolvedEdgeTarget | null>(null);
  const shiftHeld = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeld.current = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') shiftHeld.current = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

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
    return edgeEntriesToSegmentGeometrySquare(draft.edgeEntries, squareGridGeometry.cellPx);
  }, [draft.edgeEntries, squareGridGeometry, isHex]);

  const pathPickPolys = useMemo(() => {
    return pathEntriesToPolylineGeometry(draft.pathEntries, (cid) => cellCenterPx(cid));
  }, [draft.pathEntries, cellCenterPx]);

  const edgePickGeoms = useMemo(() => {
    if (!squareGridGeometry || isHex) return null;
    return edgeEntriesToSegmentGeometrySquare(draft.edgeEntries, squareGridGeometry.cellPx);
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

  const commitEdgeStroke = useCallback(() => {
    const ids = edgeStrokeEdgeIds.current;
    if (ids.length > 0 && activeDraw?.category === 'edge') {
      onEdgeStrokeCommit?.(ids, activeDraw.kind);
    }
    edgeStrokeActive.current = false;
    edgeStrokeSeen.current.clear();
    edgeStrokeEdgeIds.current = [];
    edgeStrokeLockedAxis.current = null;
    edgeStrokeLastTarget.current = null;
    setEdgeStrokeSnapshot([]);
  }, [activeDraw, onEdgeStrokeCommit]);

  useEffect(() => {
    const onWindowPointerUp = () => {
      if (paintStrokeActive.current) endPaintStroke();
      if (placeObjectStrokeActive.current) endPlaceObjectStroke();
      if (edgeStrokeActive.current) commitEdgeStroke();
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [endPaintStroke, endPlaceObjectStroke, commitEdgeStroke]);

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
          ? resolveSquareCellIdFromGridLocalPx(
              gx,
              gy,
              squareGridGeometry.cellPx,
              cols,
              rows,
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
        gx,
        gy,
        anchorCellId,
        objectsByCellId: draft.objectsByCellId,
        linkedLocationByCellId: draft.linkedLocationByCellId,
        regionIdByCellId: draft.regionIdByCellId,
        pathPolys: pathPickPolys,
        edgeGeoms: edgePickGeoms,
        edgeEntries: draft.edgeEntries,
        isHex,
      });
      setSelectHoverTarget((prev) => (mapSelectionEqual(prev, next) ? prev : next));
    },
    [
      mapEditorMode,
      validPreview,
      draft.objectsByCellId,
      draft.linkedLocationByCellId,
      draft.regionIdByCellId,
      draft.edgeEntries,
      pathPickPolys,
      edgePickGeoms,
      isHex,
      squareGridGeometry,
      cols,
      rows,
      resolveHexCellFromClient,
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
    if (hasDragMoved?.()) return;
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
          gx: 0,
          gy: 0,
          anchorCellId: cell.cellId,
          objectsByCellId: d.objectsByCellId,
          linkedLocationByCellId: d.linkedLocationByCellId,
          regionIdByCellId: d.regionIdByCellId,
          pathPolys: [],
          edgeGeoms: null,
          edgeEntries: [],
          isHex,
          skipGeometry: true,
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
        gx,
        gy,
        anchorCellId: cell.cellId,
        objectsByCellId: d.objectsByCellId,
        linkedLocationByCellId: d.linkedLocationByCellId,
        regionIdByCellId: d.regionIdByCellId,
        pathPolys: pathPickPolys,
        edgeGeoms: edgePickGeoms,
        edgeEntries: d.edgeEntries,
        isHex,
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
      if (hasDragMoved?.()) return;
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
      hasDragMoved,
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

  // ---- Edge boundary-paint pointer handlers (on the wrapper, not per-cell) ----

  const resolveEdgeFromClient = useCallback(
    (clientX: number, clientY: number): ResolvedEdgeTarget | null => {
      if (!squareGridGeometry || !gridContainerRef.current) return null;
      const rect = gridContainerRef.current.getBoundingClientRect();
      const gx = clientX - rect.left;
      const gy = clientY - rect.top;
      return resolveEdgeTargetFromGridPosition(
        gx,
        gy,
        squareGridGeometry.cellPx,
        GRID_GAP_PX,
        cols,
        rows,
      );
    },
    [squareGridGeometry, cols, rows],
  );

  const handleEdgePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!edgePlaceActive && !edgeEraseActive) return;
      e.stopPropagation();

      const target = resolveEdgeFromClient(e.clientX, e.clientY);
      setEdgeHoverTarget((prev) =>
        prev?.edgeId === target?.edgeId ? prev : target,
      );

      if (edgeStrokeActive.current && target) {
        if (edgeStrokeSeen.current.has(target.edgeId)) return;

        const last = edgeStrokeLastTarget.current;
        if (last) {
          const { accept, newAxis } = shouldAcceptStrokeEdge(
            target,
            last,
            edgeStrokeLockedAxis.current,
            shiftHeld.current,
          );
          if (!accept) return;
          edgeStrokeLockedAxis.current = newAxis;
        }

        edgeStrokeSeen.current.add(target.edgeId);
        edgeStrokeEdgeIds.current.push(target.edgeId);
        edgeStrokeLastTarget.current = target;
        setEdgeStrokeSnapshot([...edgeStrokeEdgeIds.current]);
      }
    },
    [edgePlaceActive, edgeEraseActive, resolveEdgeFromClient],
  );

  const handleEdgePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.stopPropagation();
      if (edgePlaceActive) {
        const target = resolveEdgeFromClient(e.clientX, e.clientY);
        if (!target) return;
        edgeStrokeActive.current = true;
        edgeStrokeSeen.current = new Set([target.edgeId]);
        edgeStrokeEdgeIds.current = [target.edgeId];
        edgeStrokeLockedAxis.current = getSquareEdgeOrientation(target.side);
        edgeStrokeLastTarget.current = target;
        setEdgeStrokeSnapshot([target.edgeId]);
        return;
      }
      if (edgeEraseActive) {
        const target = resolveEdgeFromClient(e.clientX, e.clientY);
        if (target) {
          onEraseEdge?.(target.edgeId);
        }
      }
    },
    [edgePlaceActive, edgeEraseActive, resolveEdgeFromClient, onEraseEdge],
  );

  const handleEdgePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (edgeStrokeActive.current) {
        e.stopPropagation();
        commitEdgeStroke();
      }
    },
    [commitEdgeStroke],
  );

  const handleEdgePointerLeave = useCallback(() => {
    setEdgeHoverTarget(null);
  }, []);

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
          boxShadow: (t) =>
            `inset 0 0 0 ${mapUi.cell.placeAnchorOutlinePx}px ${t.palette.primary.main}`,
        },
        '& .location-map-path-endpoint': {
          boxShadow: (t) =>
            `inset 0 0 0 ${mapUi.cell.pathEndpointOutlinePx}px ${t.palette.info.main}`,
        },
        '& .location-map-place-hover-preview': {
          boxShadow: (t) =>
            `inset 0 0 0 ${mapUi.cell.placeHoverPreviewOutlinePx}px ${t.palette.success.main}`,
        },
      }}
    >
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
        onClick={isHex ? handleHexFallbackClick : undefined}
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
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {isHex ? (
            <HexGridEditor
              {...sharedGridProps}
              hexSize={gridSizePx.hexCellPx || undefined}
            />
          ) : (
            <GridEditor {...sharedGridProps} />
          )}
        </Box>
        {squareGridGeometry &&
        !isHex &&
        (pathSvgData.length > 0 ||
          draft.edgeEntries.length > 0 ||
          edgeHoverTarget != null ||
          edgeStrokeSnapshot.length > 0) ? (
          <svg
            width={squareGridGeometry.width}
            height={squareGridGeometry.height}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none',
              zIndex: 2,
              display: 'block',
            }}
            aria-hidden
          >
            {edgeStrokeSnapshot.map((eid) => {
              const seg = squareEdgeSegmentPxFromEdgeId(eid, squareGridGeometry.cellPx);
              if (!seg) return null;
              return (
                <line
                  key={`stroke-${eid}`}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={mapUi.edgeBoundaryPaint.stroke}
                  strokeWidth={mapUi.edgeBoundaryPaint.strokeWidthPx}
                  strokeLinecap="square"
                  opacity={mapUi.edgeBoundaryPaint.opacity}
                />
              );
            })}
            {edgeHoverTarget &&
              !edgeStrokeSnapshot.includes(edgeHoverTarget.edgeId) &&
              (() => {
                const seg = squareEdgeSegmentPxFromEdgeId(
                  edgeHoverTarget.edgeId,
                  squareGridGeometry.cellPx,
                );
                if (!seg) return null;
                return (
                  <line
                    x1={seg.x1}
                    y1={seg.y1}
                    x2={seg.x2}
                    y2={seg.y2}
                    stroke={
                      edgeEraseActive
                        ? mapUi.edgeHover.strokeErase
                        : mapUi.edgeHover.strokePlace
                    }
                    strokeWidth={mapUi.edgeHover.strokeWidthPx}
                    strokeDasharray={mapUi.edgeHover.dasharray}
                    strokeLinecap="square"
                    opacity={mapUi.edgeHover.opacity}
                  />
                );
              })()}
            <LocationMapPathSvgPaths
              pathSvgData={pathSvgData}
              mapUi={mapUi}
              mapSelection={draft.mapSelection}
              selectHoverTarget={selectHoverTarget}
            />
            {committedEdgeSegmentGeometry.map((g) => {
              const st = mapUi.edgeCommittedStrokeByKind[g.kind];
              const seg = g.segment;
              const selected =
                (draft.mapSelection.type === 'edge' &&
                  draft.mapSelection.edgeId === g.edgeId) ||
                (draft.mapSelection.type === 'edge-run' &&
                  draft.mapSelection.edgeIds.includes(g.edgeId));
              const hovered =
                selectHoverTarget.type === 'edge-run' &&
                selectHoverTarget.edgeIds.includes(g.edgeId);
              return (
                <line
                  key={g.edgeId}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={st.stroke}
                  strokeWidth={
                    selected || hovered
                      ? st.strokeWidth + mapUi.tokens.edge.selectedStrokeWidthBoostPx
                      : st.strokeWidth
                  }
                  strokeLinecap="square"
                  {...('strokeDasharray' in st && st.strokeDasharray != null
                    ? { strokeDasharray: st.strokeDasharray }
                    : {})}
                />
              );
            })}
          </svg>
        ) : null}
        {hexGridGeometry &&
        isHex &&
        (pathSvgData.length > 0 ||
          hexSelectedRegionBoundarySegments.length > 0 ||
          hexHoverRegionBoundarySegments.length > 0) ? (
          <svg
            width={hexGridGeometry.width}
            height={hexGridGeometry.height}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none',
              zIndex: 2,
              display: 'block',
            }}
            aria-hidden
          >
            <LocationMapPathSvgPaths
              pathSvgData={pathSvgData}
              mapUi={mapUi}
              mapSelection={draft.mapSelection}
              selectHoverTarget={selectHoverTarget}
            />
            {draft.mapSelection.type === 'region' &&
              hexSelectedRegionBoundarySegments.map((seg, i) => (
                <line
                  key={`hex-region-boundary-${i}-${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}`}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  fill="none"
                  stroke={mapUi.regionSelectedOutline.stroke}
                  strokeWidth={mapUi.regionSelectedOutline.strokeWidthPx}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            {selectHoverTarget.type === 'region' &&
              !(
                draft.mapSelection.type === 'region' &&
                draft.mapSelection.regionId === selectHoverTarget.regionId
              ) &&
              hexHoverRegionBoundarySegments.map((seg, i) => (
                <line
                  key={`hex-region-hover-${i}-${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}`}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  fill="none"
                  stroke={mapUi.regionSelectedOutline.stroke}
                  strokeWidth={mapUi.regionSelectedOutline.strokeWidthPx}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.65}
                />
              ))}
          </svg>
        ) : null}
      </Box>
    </Paper>
  );
}
