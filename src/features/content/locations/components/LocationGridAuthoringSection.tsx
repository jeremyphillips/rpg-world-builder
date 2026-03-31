import {
  createElement,
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
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';

import GridEditor, { type GridCell } from '@/ui/patterns/grid/GridEditor';
import HexGridEditor from '@/ui/patterns/grid/HexGridEditor';
import type { GridGeometryId } from '@/shared/domain/grid/gridGeometry';
import {
  getLocationMapObjectKindIcon,
  getLocationScaleMapIcon,
} from '@/features/content/locations/domain';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import {
  pruneCellKeyedRecordForGrid,
  pruneExcludedCellIdsForGrid,
} from '@/features/content/locations/domain/maps/gridLayoutDraft';
import { LOCATION_CELL_FILL_KIND_META } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapEditorMode,
} from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';
import { resolveCellFillSwatchColor } from '@/app/theme/mapColors';
import type { Location } from '@/features/content/locations/domain/types';
import {
  LOCATION_EDITOR_HEADER_HEIGHT_PX,
  LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX,
} from './workspace/locationEditor.constants';

import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import {
  resolveEdgeTargetFromGridPosition,
  shouldAcceptStrokeEdge,
  getSquareEdgeOrientation,
  getSquareEdgeOrientationFromEdgeId,
  type ResolvedEdgeTarget,
  type EdgeOrientation,
} from '@/features/content/locations/domain/mapEditor/edgeAuthoring';
import { deriveSquareEdgeRunSelection } from '@/features/content/locations/domain/mapEditor/squareEdgeRunSelection';

import type { LocationGridDraftState } from './locationGridDraft.types';
import {
  BETWEEN_EDGE_ID_RE,
  SQUARE_GRID_GAP_PX,
  squareCellCenterPx,
  squareEdgeSegmentPxFromEdgeId,
} from './squareGridMapOverlayGeometry';
import { edgeEntriesToSegmentGeometrySquare } from '@/shared/domain/locations/map/locationMapEdgeGeometry.helpers';
import {
  pathEntriesToPolylineGeometry,
  pathEntryToPolylineGeometry,
} from '@/shared/domain/locations/map/locationMapPathPolyline.helpers';
import {
  DEFAULT_EDGE_PICK_HALF_WIDTH_PX,
  DEFAULT_PATH_PICK_TOLERANCE_PX,
  resolveNearestEdgeHit,
  resolveNearestPathHit,
} from '@/features/content/locations/domain/mapEditor/locationMapSelectionHitTest';
import { hexCellCenterPx, hexOverlayDimensions, resolveNearestHexCell } from './hexGridMapOverlayGeometry';
import { polylinePoint2DToSmoothSvgPath } from './pathOverlayRendering';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import { getNeighborPoints } from '@/shared/domain/grid/gridHelpers';

const GRID_GAP_PX = SQUARE_GRID_GAP_PX; // MUI spacing(0.5) — matches GridEditor gap
const MIN_CELL_PX = 24;
const CANVAS_INSET_PX = 48; // breathing room so grid doesn't touch canvas edges

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
  campaignId: _campaignId,
  hostLocationId: _hostLocationId,
  hostScale: _hostScale,
  hostName: _hostName,
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

  const edgePlaceActive = mapEditorMode === 'draw' && activeDraw?.category === 'edge';
  const edgeEraseActive = mapEditorMode === 'erase';

  useEffect(() => {
    if (!validPreview) return;
    setDraft((prev) => {
      const prunedExcluded = pruneExcludedCellIdsForGrid(prev.excludedCellIds, cols, rows);
      const prunedLinks = pruneCellKeyedRecordForGrid(prev.linkedLocationByCellId, cols, rows);
      const prunedObjs = pruneCellKeyedRecordForGrid(prev.objectsByCellId, cols, rows);
      const prunedFill = pruneCellKeyedRecordForGrid(prev.cellFillByCellId, cols, rows);
      const cellInBounds = (cellId: string) => {
        const p = parseGridCellId(cellId);
        if (!p) return false;
        return p.x >= 0 && p.y >= 0 && p.x < cols && p.y < rows;
      };
      const prunedPaths = prev.pathEntries.filter((pe) =>
        pe.cellIds.every((cid) => cellInBounds(cid.trim())),
      );
      const prunedEdges = prev.edgeEntries.filter((e) => {
        const m = BETWEEN_EDGE_ID_RE.exec(e.edgeId);
        if (!m) return false;
        return cellInBounds(m[1]) && cellInBounds(m[2]);
      });
      let nextSel = prev.selectedCellId;
      if (nextSel) {
        const p = parseGridCellId(nextSel);
        if (!p || p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows) {
          nextSel = null;
        }
      }

      let nextMapSelection = prev.mapSelection;
      const ms = prev.mapSelection;
      if (ms.type === 'cell') {
        if (nextSel == null || ms.cellId !== nextSel) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'object') {
        const objs = prunedObjs[ms.cellId];
        if (!objs?.some((o) => o.id === ms.objectId)) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'path') {
        if (!prunedPaths.some((p) => p.id === ms.pathId)) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'edge') {
        if (!prunedEdges.some((e) => e.edgeId === ms.edgeId)) {
          nextMapSelection = { type: 'none' };
        }
      } else if (ms.type === 'edge-run') {
        const allPresent = ms.edgeIds.every((id) =>
          prunedEdges.some((e) => e.edgeId === id),
        );
        if (!allPresent) {
          nextMapSelection = { type: 'none' };
        }
      }

      const sameLen = prunedExcluded.length === prev.excludedCellIds.length;
      const sameIds =
        sameLen && prunedExcluded.every((id, i) => id === prev.excludedCellIds[i]);
      const linksSame =
        JSON.stringify(prunedLinks) === JSON.stringify(prev.linkedLocationByCellId);
      const objsSame =
        JSON.stringify(prunedObjs) === JSON.stringify(prev.objectsByCellId);
      const fillSame =
        JSON.stringify(prunedFill) === JSON.stringify(prev.cellFillByCellId);
      const pathsSame = JSON.stringify(prunedPaths) === JSON.stringify(prev.pathEntries);
      const edgesSame = JSON.stringify(prunedEdges) === JSON.stringify(prev.edgeEntries);
      const mapSelSame =
        JSON.stringify(nextMapSelection) === JSON.stringify(prev.mapSelection);
      if (
        sameIds &&
        nextSel === prev.selectedCellId &&
        linksSame &&
        objsSame &&
        fillSame &&
        pathsSame &&
        edgesSame &&
        mapSelSame
      ) {
        return prev;
      }
      return {
        ...prev,
        mapSelection: nextMapSelection,
        excludedCellIds: prunedExcluded,
        selectedCellId: nextSel,
        linkedLocationByCellId: prunedLinks,
        objectsByCellId: prunedObjs,
        cellFillByCellId: prunedFill,
        pathEntries: prunedPaths,
        edgeEntries: prunedEdges,
      };
    });
  }, [validPreview, cols, rows, setDraft]);

  useEffect(() => {
    if (!placePathAnchorCellId) {
      setPlaceHoverCellId(null);
    }
  }, [placePathAnchorCellId]);

  const isHex = gridGeometry === 'hex';

  const gridSizePx = useMemo(() => {
    if (!validPreview) return { width: 0, hexCellPx: 0 };
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const canvasH = vh - LOCATION_EDITOR_HEADER_HEIGHT_PX - CANVAS_INSET_PX * 2;
    const canvasW =
      vw -
      LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX -
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
      if (squareGridGeometry) return squareCellCenterPx(cellId, squareGridGeometry.cellPx);
      return null;
    },
    [isHex, hexGridGeometry, squareGridGeometry],
  );

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

  const pathOverlayStroke = theme.palette.info.main;

  /** Committed edge features (square grid only): shared geometry layer → SVG lines below. */
  const committedEdgeSegmentGeometry = useMemo(() => {
    if (!squareGridGeometry || isHex) return [];
    return edgeEntriesToSegmentGeometrySquare(draft.edgeEntries, squareGridGeometry.cellPx);
  }, [draft.edgeEntries, squareGridGeometry, isHex]);

  const edgeOverlayStrokeProps = useMemo(() => {
    const wall = {
      stroke: alpha(theme.palette.text.primary, 0.95),
      strokeWidth: 15,
    };
    const window = {
      stroke: alpha(theme.palette.info.main, 0.95),
      strokeWidth: 15,
      strokeDasharray: '4 3' as const,
    };
    const door = {
      stroke: alpha(theme.palette.warning.main, 0.95),
      strokeWidth: 15,
    };
    return {
      wall,
      window,
      door,
    } satisfies Record<
      LocationEdgeFeatureKindId,
      { stroke: string; strokeWidth: number; strokeDasharray?: string }
    >;
  }, [theme.palette.info.main, theme.palette.text.primary, theme.palette.warning.main]);


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
        if (!activePaint) return;
        setDraft((d) => ({
          ...d,
          cellFillByCellId: { ...d.cellFillByCellId, [cellId]: activePaint },
        }));
      } else if (mapEditorMode === 'erase') {
        setDraft((d) => {
          const next = { ...d.cellFillByCellId };
          delete next[cellId];
          return { ...d, cellFillByCellId: next };
        });
      }
    },
    [activePaint, mapEditorMode, setDraft],
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
      e.stopPropagation();
      if (mapEditorMode === 'paint' && !activePaint) return;
      paintStrokeActive.current = true;
      strokeSeen.current = new Set();
      applyStrokeCell(cell.cellId);
    },
    [activePaint, applyStrokeCell, mapEditorMode],
  );

  const handlePaintPointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (!paintStrokeActive.current) return;
      if (e.buttons !== 1) return;
      if (mapEditorMode === 'paint' && !activePaint) return;
      e.stopPropagation();
      applyStrokeCell(cell.cellId);
    },
    [activePaint, applyStrokeCell, mapEditorMode],
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
    (e: ReactPointerEvent<HTMLElement>, _cell: GridCell) => {
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
      setDraft((d) => ({
        ...d,
        mapSelection: { type: 'cell', cellId: cell.cellId },
        selectedCellId: cell.cellId,
      }));
      onCellFocusRail?.();
      return;
    }
    const rect = gridContainerRef.current.getBoundingClientRect();
    const gx = e.clientX - rect.left;
    const gy = e.clientY - rect.top;

    const target = e.target as HTMLElement;
    const objWrap = target.closest('[data-map-object-id]');
    if (objWrap) {
      const objectId = objWrap.getAttribute('data-map-object-id');
      const cellId =
        objWrap.getAttribute('data-map-object-cell-id') ?? cell.cellId;
      if (objectId) {
        setDraft((d) => ({
          ...d,
          mapSelection: { type: 'object', cellId, objectId },
          selectedCellId: cellId,
        }));
        onCellFocusRail?.();
        return;
      }
    }

    // Select-mode hit order (square): object → path → edge → cell. Path before edge: authored paths
    // run near boundary geometry; edge pick would otherwise steal path clicks.
    const pathPolys = pathEntriesToPolylineGeometry(draft.pathEntries, (cid) =>
      cellCenterPx(cid),
    );
    const pathHit = resolveNearestPathHit(
      gx,
      gy,
      pathPolys,
      DEFAULT_PATH_PICK_TOLERANCE_PX,
    );
    if (pathHit) {
      setDraft((d) => ({
        ...d,
        mapSelection: { type: 'path', pathId: pathHit.pathId },
        selectedCellId: null,
      }));
      onCellFocusRail?.();
      return;
    }

    if (!isHex && squareGridGeometry) {
      const edgeGeoms = edgeEntriesToSegmentGeometrySquare(
        draft.edgeEntries,
        squareGridGeometry.cellPx,
      );
      const edgeHit = resolveNearestEdgeHit(
        gx,
        gy,
        edgeGeoms,
        DEFAULT_EDGE_PICK_HALF_WIDTH_PX,
      );
      if (edgeHit) {
        const run = deriveSquareEdgeRunSelection(edgeHit.edgeId, draft.edgeEntries);
        const entry = draft.edgeEntries.find((e) => e.edgeId === edgeHit.edgeId);
        const axis = entry ? getSquareEdgeOrientationFromEdgeId(edgeHit.edgeId) : null;
        if (run) {
          setDraft((d) => ({
            ...d,
            mapSelection: {
              type: 'edge-run',
              kind: run.kind,
              edgeIds: run.edgeIds,
              axis: run.axis,
              anchorEdgeId: run.anchorEdgeId,
            },
            selectedCellId: null,
          }));
        } else if (entry && axis) {
          setDraft((d) => ({
            ...d,
            mapSelection: {
              type: 'edge-run',
              kind: entry.kind,
              edgeIds: [edgeHit.edgeId],
              axis,
              anchorEdgeId: edgeHit.edgeId,
            },
            selectedCellId: null,
          }));
        }
        onCellFocusRail?.();
        return;
      }
    }

    setDraft((d) => ({
      ...d,
      mapSelection: { type: 'cell', cellId: cell.cellId },
      selectedCellId: cell.cellId,
    }));
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

  const renderMapCellIcons = (cell: GridCell) => {
    const linkId = draft.linkedLocationByCellId[cell.cellId];
    const objs = draft.objectsByCellId[cell.cellId];
    const linked = linkId ? locationById.get(linkId) : undefined;
    if (!linked && (!objs || objs.length === 0)) return null;
    const iconSx = {
      fontSize: 22,
      width: 22,
      height: 22,
      display: 'block' as const,
    };
    return (
      <Stack
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
        gap={0.25}
        sx={{ lineHeight: 0, maxWidth: '100%' }}
      >
        {linked
          ? (
              <Box
                component="span"
                data-map-linked-cell={cell.cellId}
                sx={{ display: 'inline-flex', lineHeight: 0 }}
              >
                {createElement(getLocationScaleMapIcon(linked.scale), {
                  sx: iconSx,
                  color: 'action',
                  'aria-hidden': true,
                })}
              </Box>
            )
          : null}
        {objs?.map((o) => (
          <Box
            key={o.id}
            component="span"
            data-map-object-id={o.id}
            data-map-object-cell-id={cell.cellId}
            sx={{ display: 'inline-flex', lineHeight: 0 }}
          >
            {createElement(getLocationMapObjectKindIcon(o.kind), {
              sx: iconSx,
              color: 'action',
              'aria-hidden': true,
            })}
          </Box>
        ))}
      </Stack>
    );
  };

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
    selectedCellId: draft.selectedCellId,
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
          boxShadow: (t) => `inset 0 0 0 3px ${t.palette.primary.main}`,
        },
        '& .location-map-path-endpoint': {
          boxShadow: (t) => `inset 0 0 0 2px ${t.palette.info.main}`,
        },
        '& .location-map-place-hover-preview': {
          boxShadow: (t) => `inset 0 0 0 2px ${t.palette.success.main}`,
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
        onPointerMove={
          placePathPlacement ? handlePlacePathEdgePointerMove : undefined
        }
        onPointerLeave={() => {
          if (edgePlaceActive || edgeEraseActive) handleEdgePointerLeave();
          if (placePathPlacement) setPlaceHoverCellId(null);
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
                  stroke={theme.palette.primary.main}
                  strokeWidth={4}
                  strokeLinecap="square"
                  opacity={0.7}
                />
              );
            })}
            {edgeHoverTarget &&
              !edgeStrokeSeen.current.has(edgeHoverTarget.edgeId) &&
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
                        ? theme.palette.error.main
                        : theme.palette.primary.light
                    }
                    strokeWidth={3}
                    strokeDasharray="5 3"
                    strokeLinecap="square"
                    opacity={0.6}
                  />
                );
              })()}
            {pathSvgData.map((p) => (
              <path
                key={`path-${p.pathId}`}
                d={p.d}
                fill="none"
                stroke={pathOverlayStroke}
                strokeWidth={
                  p.pathId !== '__preview__' &&
                  draft.mapSelection.type === 'path' &&
                  draft.mapSelection.pathId === p.pathId
                    ? 4.5
                    : 2.5
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {committedEdgeSegmentGeometry.map((g) => {
              const st = edgeOverlayStrokeProps[g.kind];
              const seg = g.segment;
              const selected =
                (draft.mapSelection.type === 'edge' &&
                  draft.mapSelection.edgeId === g.edgeId) ||
                (draft.mapSelection.type === 'edge-run' &&
                  draft.mapSelection.edgeIds.includes(g.edgeId));
              return (
                <line
                  key={g.edgeId}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={st.stroke}
                  strokeWidth={selected ? st.strokeWidth + 4 : st.strokeWidth}
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
        pathSvgData.length > 0 ? (
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
            {pathSvgData.map((p) => (
              <path
                key={`path-${p.pathId}`}
                d={p.d}
                fill="none"
                stroke={pathOverlayStroke}
                strokeWidth={
                  p.pathId !== '__preview__' &&
                  draft.mapSelection.type === 'path' &&
                  draft.mapSelection.pathId === p.pathId
                    ? 4.5
                    : 2.5
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        ) : null}
      </Box>
    </Paper>
  );
}
