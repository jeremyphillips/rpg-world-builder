import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

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

import type { LocationGridDraftState } from './locationGridDraft.types';

const GRID_GAP_PX = 4; // MUI spacing(0.5) — matches GridEditor gap
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
}: LocationGridAuthoringSectionProps) {
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
      const betweenRe = /^between:([^|]+)\|([^|]+)$/;
      const prunedEdges = prev.edgeFeatures.filter((e) => {
        const m = betweenRe.exec(e.edgeId);
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

  const locationById = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations],
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

  useEffect(() => {
    const onWindowPointerUp = () => {
      if (paintStrokeActive.current) endPaintStroke();
    };
    window.addEventListener('pointerup', onWindowPointerUp);
    return () => window.removeEventListener('pointerup', onWindowPointerUp);
  }, [endPaintStroke]);

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

  if (!validPreview) return null;

  const onCellClick = (cell: GridCell) => {
    if (mapEditorMode === 'place') {
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

  const paintOrClear = mapEditorMode === 'paint' || mapEditorMode === 'clear-fill';

  const sharedGridProps = {
    columns: cols,
    rows: rows,
    selectedCellId: draft.selectedCellId,
    excludedCellIds: draft.excludedCellIds,
    onCellClick,
    getCellBackgroundColor,
    onCellPointerDown: paintOrClear ? handlePaintPointerDown : undefined,
    onCellPointerEnter: paintOrClear ? handlePaintPointerEnter : undefined,
    onCellPointerUp: paintOrClear ? handlePaintPointerUp : undefined,
    renderCellContent: renderMapCellIcons,
  };

  return (
    <Paper variant="outlined" sx={{ p: 1 }}>
      <Box sx={{ width: gridSizePx.width }}>
        {isHex ? (
          <HexGridEditor
            {...sharedGridProps}
            hexSize={gridSizePx.hexCellPx || undefined}
          />
        ) : (
          <GridEditor {...sharedGridProps} />
        )}
      </Box>
    </Paper>
  );
}
