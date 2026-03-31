import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
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

import type { LocationGridDraftState } from './locationGridDraft.types';
import {
  BETWEEN_EDGE_ID_RE,
  SQUARE_GRID_GAP_PX,
  squareCellCenterPx,
  squareSharedEdgeSegmentPx,
} from './squareGridMapOverlayGeometry';

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
  /** Place mode: first cell chosen for edge feature (two-click flow). */
  placeEdgeAnchorCellId?: string | null;
  /**
   * When true with place mode, cell pointer events stop propagation so the map canvas
   * does not pan (same idea as paint/clear-fill strokes).
   */
  suppressCanvasPanOnCells?: boolean;
  /**
   * When true, **object** placement uses pointer drag (down + enter) like paint so dragging
   * across cells places on each cell. Path / edge / link still use click-only flows.
   */
  placeObjectDragStrokeEnabled?: boolean;
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
  placeEdgeAnchorCellId = null,
  suppressCanvasPanOnCells = false,
  placeObjectDragStrokeEnabled = false,
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
      const prunedPaths = prev.pathSegments.filter(
        (s) => cellInBounds(s.startCellId) && cellInBounds(s.endCellId),
      );
      const prunedEdges = prev.edgeFeatures.filter((e) => {
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
      const sameLen = prunedExcluded.length === prev.excludedCellIds.length;
      const sameIds =
        sameLen && prunedExcluded.every((id, i) => id === prev.excludedCellIds[i]);
      const linksSame =
        JSON.stringify(prunedLinks) === JSON.stringify(prev.linkedLocationByCellId);
      const objsSame =
        JSON.stringify(prunedObjs) === JSON.stringify(prev.objectsByCellId);
      const fillSame =
        JSON.stringify(prunedFill) === JSON.stringify(prev.cellFillByCellId);
      const pathsSame = JSON.stringify(prunedPaths) === JSON.stringify(prev.pathSegments);
      const edgesSame = JSON.stringify(prunedEdges) === JSON.stringify(prev.edgeFeatures);
      if (
        sameIds &&
        nextSel === prev.selectedCellId &&
        linksSame &&
        objsSame &&
        fillSame &&
        pathsSame &&
        edgesSame
      ) {
        return prev;
      }
      return {
        ...prev,
        excludedCellIds: prunedExcluded,
        selectedCellId: nextSel,
        linkedLocationByCellId: prunedLinks,
        objectsByCellId: prunedObjs,
        cellFillByCellId: prunedFill,
        pathSegments: prunedPaths,
        edgeFeatures: prunedEdges,
      };
    });
  }, [validPreview, cols, rows, setDraft]);

  useEffect(() => {
    if (!placePathAnchorCellId && !placeEdgeAnchorCellId) {
      setPlaceHoverCellId(null);
    }
  }, [placePathAnchorCellId, placeEdgeAnchorCellId]);

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

  const pathOverlayStroke = theme.palette.info.main;

  const edgeOverlayStrokeProps = useMemo(() => {
    const wall = {
      stroke: alpha(theme.palette.text.primary, 0.95),
      strokeWidth: 4,
    };
    const window = {
      stroke: alpha(theme.palette.info.main, 0.95),
      strokeWidth: 2,
      strokeDasharray: '4 3' as const,
    };
    const door = {
      stroke: alpha(theme.palette.warning.main, 0.95),
      strokeWidth: 2.75,
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

  const pathPlacementPreview = useMemo(() => {
    if (!squareGridGeometry || !placePathAnchorCellId || !placeHoverCellId) return null;
    if (placePathAnchorCellId === placeHoverCellId) return null;
    const pa = parseGridCellId(placePathAnchorCellId);
    const pb = parseGridCellId(placeHoverCellId);
    if (!pa || !pb) return null;
    const a = squareCellCenterPx(placePathAnchorCellId, squareGridGeometry.cellPx);
    const b = squareCellCenterPx(placeHoverCellId, squareGridGeometry.cellPx);
    if (!a || !b) return null;
    const ortho = Math.abs(pa.x - pb.x) + Math.abs(pa.y - pb.y) === 1;
    return { x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy, valid: ortho };
  }, [squareGridGeometry, placePathAnchorCellId, placeHoverCellId]);

  const edgePlacementPreview = useMemo(() => {
    if (!squareGridGeometry || !placeEdgeAnchorCellId || !placeHoverCellId) return null;
    if (placeEdgeAnchorCellId === placeHoverCellId) return null;
    const cellPx = squareGridGeometry.cellPx;
    const seg = squareSharedEdgeSegmentPx(
      placeEdgeAnchorCellId,
      placeHoverCellId,
      cellPx,
    );
    if (seg) {
      return { mode: 'gutter' as const, ...seg, valid: true as const };
    }
    const a = squareCellCenterPx(placeEdgeAnchorCellId, cellPx);
    const b = squareCellCenterPx(placeHoverCellId, cellPx);
    if (!a || !b) return null;
    return {
      mode: 'centers' as const,
      x1: a.cx,
      y1: a.cy,
      x2: b.cx,
      y2: b.cy,
      valid: false as const,
    };
  }, [squareGridGeometry, placeEdgeAnchorCellId, placeHoverCellId]);

  const locationById = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations],
  );

  const pathEndpointCells = useMemo(() => {
    const s = new Set<string>();
    for (const seg of draft.pathSegments) {
      s.add(seg.startCellId.trim());
      s.add(seg.endCellId.trim());
    }
    return s;
  }, [draft.pathSegments]);

  const edgeEndpointCells = useMemo(() => {
    const s = new Set<string>();
    for (const e of draft.edgeFeatures) {
      const m = BETWEEN_EDGE_ID_RE.exec(e.edgeId);
      if (m) {
        s.add(m[1].trim());
        s.add(m[2].trim());
      }
    }
    return s;
  }, [draft.edgeFeatures]);

  const getCellClassName = useCallback(
    (cell: GridCell) => {
      const id = cell.cellId;
      if (placePathAnchorCellId && id === placePathAnchorCellId) {
        return 'location-map-place-anchor-path';
      }
      if (placeEdgeAnchorCellId && id === placeEdgeAnchorCellId) {
        return 'location-map-place-anchor-edge';
      }
      if (placeHoverCellId && id === placeHoverCellId) {
        return 'location-map-place-hover-preview';
      }
      if (pathEndpointCells.has(id)) return 'location-map-path-endpoint';
      if (edgeEndpointCells.has(id)) return 'location-map-edge-endpoint';
      return undefined;
    },
    [
      placePathAnchorCellId,
      placeEdgeAnchorCellId,
      placeHoverCellId,
      pathEndpointCells,
      edgeEndpointCells,
    ],
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
      } else if (mapEditorMode === 'clear-fill') {
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

  useEffect(() => {
    const onWindowPointerUp = () => {
      if (paintStrokeActive.current) endPaintStroke();
      if (placeObjectStrokeActive.current) endPlaceObjectStroke();
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [endPaintStroke, endPlaceObjectStroke]);

  const handlePaintPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (mapEditorMode !== 'paint' && mapEditorMode !== 'clear-fill') return;
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
      if (mapEditorMode !== 'paint' && mapEditorMode !== 'clear-fill') return;
      e.stopPropagation();
      endPaintStroke();
    },
    [endPaintStroke, mapEditorMode],
  );

  const paintOrClear = mapEditorMode === 'paint' || mapEditorMode === 'clear-fill';

  const suppressEdgePlacePan =
    suppressCanvasPanOnCells && mapEditorMode === 'place';

  const placeObjectStrokeMode =
    placeObjectDragStrokeEnabled && mapEditorMode === 'place';

  const placePathEdgePlacement =
    mapEditorMode === 'place' &&
    !placeObjectStrokeMode &&
    (placePathAnchorCellId != null || placeEdgeAnchorCellId != null);

  const handleCellPointerDownForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (paintOrClear) {
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
      if (placePathEdgePlacement) {
        e.stopPropagation();
        return;
      }
      if (suppressEdgePlacePan) {
        e.stopPropagation();
      }
    },
    [
      paintOrClear,
      handlePaintPointerDown,
      placeObjectStrokeMode,
      onPlaceCellClick,
      placePathEdgePlacement,
      suppressEdgePlacePan,
    ],
  );

  const updatePlaceHoverFromPointerClient = useCallback(
    (clientX: number, clientY: number) => {
      const top = document.elementFromPoint(clientX, clientY);
      if (!top) {
        setPlaceHoverCellId((prev) => (prev === null ? prev : null));
        return;
      }
      const cellEl = top.closest('[role="gridcell"]');
      const id = cellEl?.getAttribute('data-cell-id');
      const next = id ?? null;
      setPlaceHoverCellId((prev) => (prev === next ? prev : next));
    },
    [],
  );

  const handlePlacePathEdgePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!placePathEdgePlacement) return;
      updatePlaceHoverFromPointerClient(e.clientX, e.clientY);
    },
    [placePathEdgePlacement, updatePlaceHoverFromPointerClient],
  );

  const handleCellPointerEnterForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, cell: GridCell) => {
      if (paintOrClear) {
        handlePaintPointerEnter(e, cell);
        return;
      }
      if (placePathEdgePlacement) {
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
      paintOrClear,
      handlePaintPointerEnter,
      placePathEdgePlacement,
      placeObjectStrokeMode,
      onPlaceCellClick,
    ],
  );

  const handleCellPointerUpForGrid = useCallback(
    (e: ReactPointerEvent<HTMLElement>, _cell: GridCell) => {
      if (paintOrClear) {
        handlePaintPointerUp(e);
        return;
      }
      if (placeObjectStrokeActive.current && placeObjectStrokeMode) {
        e.stopPropagation();
        endPlaceObjectStroke();
        return;
      }
      if (placePathEdgePlacement) {
        e.stopPropagation();
        return;
      }
      if (suppressEdgePlacePan) {
        e.stopPropagation();
      }
    },
    [
      paintOrClear,
      handlePaintPointerUp,
      placeObjectStrokeMode,
      endPlaceObjectStroke,
      placePathEdgePlacement,
      suppressEdgePlacePan,
    ],
  );

  const onCellClick = (cell: GridCell) => {
    if (mapEditorMode === 'place') {
      if (placeObjectStrokeMode) {
        return;
      }
      onPlaceCellClick?.(cell.cellId);
      return;
    }
    if (mapEditorMode === 'erase') {
      onEraseCellClick?.(cell.cellId);
      return;
    }
    if (mapEditorMode === 'paint' || mapEditorMode === 'clear-fill') {
      return;
    }
    setDraft((d) => ({
      ...d,
      selectedCellId: cell.cellId,
    }));
    onCellFocusRail?.();
  };

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
          ? createElement(getLocationScaleMapIcon(linked.scale), {
              sx: iconSx,
              color: 'action',
              'aria-hidden': true,
            })
          : null}
        {objs?.map((o) =>
          createElement(getLocationMapObjectKindIcon(o.kind), {
            key: o.id,
            sx: iconSx,
            color: 'action',
            'aria-hidden': true,
          }),
        )}
      </Stack>
    );
  };

  const mapToolCrosshair =
    mapEditorMode === 'place' ||
    mapEditorMode === 'erase' ||
    mapEditorMode === 'paint' ||
    mapEditorMode === 'clear-fill';

  const sharedGridProps = {
    columns: cols,
    rows: rows,
    selectedCellId: draft.selectedCellId,
    excludedCellIds: draft.excludedCellIds,
    onCellClick,
    getCellBackgroundColor,
    onCellPointerDown:
      paintOrClear ||
      placeObjectStrokeMode ||
      placePathEdgePlacement ||
      suppressEdgePlacePan
        ? handleCellPointerDownForGrid
        : undefined,
    onCellPointerEnter:
      paintOrClear || placeObjectStrokeMode || placePathEdgePlacement
        ? handleCellPointerEnterForGrid
        : undefined,
    onCellPointerUp:
      paintOrClear ||
      placeObjectStrokeMode ||
      placePathEdgePlacement ||
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
        '& .location-map-place-anchor-path': {
          boxShadow: (t) => `inset 0 0 0 3px ${t.palette.primary.main}`,
        },
        '& .location-map-place-anchor-edge': {
          boxShadow: (t) => `inset 0 0 0 3px ${t.palette.secondary.main}`,
        },
        '& .location-map-path-endpoint': {
          boxShadow: (t) => `inset 0 0 0 2px ${t.palette.info.main}`,
        },
        '& .location-map-edge-endpoint': {
          boxShadow: (t) => `inset 0 0 0 1px dashed ${t.palette.divider}`,
        },
        '& .location-map-place-hover-preview': {
          boxShadow: (t) => `inset 0 0 0 2px ${t.palette.success.main}`,
        },
      }}
    >
      <Box
        sx={{ position: 'relative', width: gridSizePx.width }}
        onPointerMove={
          placePathEdgePlacement ? handlePlacePathEdgePointerMove : undefined
        }
        onPointerLeave={() => {
          if (placePathEdgePlacement) setPlaceHoverCellId(null);
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
        (draft.pathSegments.length > 0 ||
          draft.edgeFeatures.length > 0 ||
          pathPlacementPreview != null ||
          edgePlacementPreview != null) ? (
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
            {pathPlacementPreview ? (
              <line
                x1={pathPlacementPreview.x1}
                y1={pathPlacementPreview.y1}
                x2={pathPlacementPreview.x2}
                y2={pathPlacementPreview.y2}
                stroke={
                  pathPlacementPreview.valid
                    ? theme.palette.primary.main
                    : theme.palette.error.main
                }
                strokeWidth={3}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            ) : null}
            {edgePlacementPreview ? (
              <line
                x1={edgePlacementPreview.x1}
                y1={edgePlacementPreview.y1}
                x2={edgePlacementPreview.x2}
                y2={edgePlacementPreview.y2}
                stroke={
                  edgePlacementPreview.valid
                    ? theme.palette.primary.main
                    : theme.palette.warning.main
                }
                strokeWidth={edgePlacementPreview.valid ? 4 : 2}
                strokeLinecap="square"
                {...(!edgePlacementPreview.valid ? { strokeDasharray: '5 4' } : {})}
              />
            ) : null}
            {draft.pathSegments.map((seg) => {
              const a = squareCellCenterPx(seg.startCellId, squareGridGeometry.cellPx);
              const b = squareCellCenterPx(seg.endCellId, squareGridGeometry.cellPx);
              if (!a || !b) return null;
              return (
                <line
                  key={seg.id}
                  x1={a.cx}
                  y1={a.cy}
                  x2={b.cx}
                  y2={b.cy}
                  stroke={pathOverlayStroke}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              );
            })}
            {draft.edgeFeatures.map((e) => {
              const m = BETWEEN_EDGE_ID_RE.exec(e.edgeId);
              if (!m) return null;
              const seg = squareSharedEdgeSegmentPx(
                m[1].trim(),
                m[2].trim(),
                squareGridGeometry.cellPx,
              );
              if (!seg) return null;
              const st = edgeOverlayStrokeProps[e.kind];
              return (
                <line
                  key={e.id}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={st.stroke}
                  strokeWidth={st.strokeWidth}
                  strokeLinecap="square"
                  {...('strokeDasharray' in st && st.strokeDasharray != null
                    ? { strokeDasharray: st.strokeDasharray }
                    : {})}
                />
              );
            })}
          </svg>
        ) : null}
      </Box>
    </Paper>
  );
}
