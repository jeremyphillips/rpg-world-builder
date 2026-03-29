import { createElement, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import Box from '@mui/material/Box';
// import FormControlLabel from '@mui/material/FormControlLabel';
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
import type { Location } from '@/features/content/locations/domain/types';
import {
  LOCATION_EDITOR_HEADER_HEIGHT_PX,
  LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX,
} from './workspace/locationEditor.constants';

import { LocationGridCellModal } from './LocationGridCellModal';
import type { LocationCellObjectDraft, LocationGridDraftState } from './locationGridDraft.types';

const GRID_GAP_PX = 4 // MUI spacing(0.5) — matches GridEditor gap
const MIN_CELL_PX = 24
const CANVAS_INSET_PX = 48 // breathing room so grid doesn't touch canvas edges

type LocationGridAuthoringSectionProps = {
  gridColumns: string;
  gridRows: string;
  gridGeometry?: GridGeometryId | string;
  draft: LocationGridDraftState;
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  /** Campaign locations (for cell modal link picker). */
  locations: Location[];
  campaignId?: string;
  /** Current location being edited; omit on create. */
  hostLocationId?: string;
  hostScale: string;
  hostName?: string;
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

  useEffect(() => {
    if (!validPreview) return;
    setDraft((prev) => {
      const prunedExcluded = pruneExcludedCellIdsForGrid(prev.excludedCellIds, cols, rows);
      const prunedLinks = pruneCellKeyedRecordForGrid(prev.linkedLocationByCellId, cols, rows);
      const prunedObjs = pruneCellKeyedRecordForGrid(prev.objectsByCellId, cols, rows);
      let nextSel = prev.selectedCellId;
      if (nextSel) {
        const p = parseGridCellId(nextSel);
        if (!p || p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows) {
          nextSel = null;
        }
      }
      let nextModal = prev.cellModalCellId;
      if (nextModal) {
        const p = parseGridCellId(nextModal);
        if (!p || p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows) {
          nextModal = null;
        }
      }
      const sameLen = prunedExcluded.length === prev.excludedCellIds.length;
      const sameIds =
        sameLen && prunedExcluded.every((id, i) => id === prev.excludedCellIds[i]);
      const linksSame =
        JSON.stringify(prunedLinks) === JSON.stringify(prev.linkedLocationByCellId);
      const objsSame =
        JSON.stringify(prunedObjs) === JSON.stringify(prev.objectsByCellId);
      if (
        sameIds &&
        nextSel === prev.selectedCellId &&
        nextModal === prev.cellModalCellId &&
        linksSame &&
        objsSame
      ) {
        return prev;
      }
      return {
        ...prev,
        excludedCellIds: prunedExcluded,
        selectedCellId: nextSel,
        cellModalCellId: nextModal,
        linkedLocationByCellId: prunedLinks,
        objectsByCellId: prunedObjs,
      };
    });
  }, [validPreview, cols, rows, setDraft]);

  const isHex = gridGeometry === 'hex'

  const gridSizePx = useMemo(() => {
    if (!validPreview) return { width: 0, hexCellPx: 0 }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const canvasH = vh - LOCATION_EDITOR_HEADER_HEIGHT_PX - CANVAS_INSET_PX * 2
    const canvasW = vw - LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX - CANVAS_INSET_PX * 2

    if (isHex) {
      const hexRatio = Math.sqrt(3) / 2
      const maxHexW_fromW = (canvasW - 0.25) / (0.75 * (cols - 1) + 1)
      const maxHexH = canvasH / ((rows - 1) + 1 + 0.5)
      const maxHexW_fromH = maxHexH / hexRatio
      const hexCellPx = Math.max(MIN_CELL_PX, Math.floor(Math.min(maxHexW_fromW, maxHexW_fromH)))
      const width = Math.ceil(0.75 * hexCellPx * (cols - 1) + hexCellPx)
      return { width, hexCellPx }
    }

    const vertGaps = Math.max(0, rows - 1) * GRID_GAP_PX
    const horzGaps = Math.max(0, cols - 1) * GRID_GAP_PX
    const cellFromH = (canvasH - vertGaps) / rows
    const cellFromW = (canvasW - horzGaps) / cols
    const cellSize = Math.max(MIN_CELL_PX, Math.floor(Math.min(cellFromH, cellFromW)))
    return { width: cellSize * cols + horzGaps, hexCellPx: 0 }
  }, [validPreview, cols, rows, isHex]);

  const locationById = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations],
  );

  if (!validPreview) return null;

  const onCellClick = (cell: GridCell) => {
    setDraft((d) => ({
      ...d,
      selectedCellId: cell.cellId,
      cellModalCellId: cell.cellId,
    }));
  };

  const toggleExcludedForSelected = () => {
    const id = draft.selectedCellId;
    if (!id) return;
    setDraft((d) => {
      const next = new Set(d.excludedCellIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return {
        ...d,
        excludedCellIds: [...next].sort(),
      };
    });
  };

  const onUpdateLinkedLocation = (cellId: string, locationId: string | undefined) => {
    setDraft((prev) => {
      const nextLinks = { ...prev.linkedLocationByCellId };
      if (locationId) nextLinks[cellId] = locationId;
      else delete nextLinks[cellId];
      return { ...prev, linkedLocationByCellId: nextLinks };
    });
  };

  const onUpdateCellObjects = (cellId: string, objects: LocationCellObjectDraft[]) => {
    setDraft((prev) => {
      const next = { ...prev.objectsByCellId };
      if (objects.length === 0) delete next[cellId];
      else next[cellId] = objects;
      return { ...prev, objectsByCellId: next };
    });
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

  const sharedGridProps = {
    columns: cols,
    rows: rows,
    selectedCellId: draft.selectedCellId,
    excludedCellIds: draft.excludedCellIds,
    onCellClick,
    renderCellContent: renderMapCellIcons,
  }

  return (
    <>
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

      <LocationGridCellModal
        open={draft.cellModalCellId != null}
        cellId={draft.cellModalCellId}
        hostLocationId={hostLocationId}
        hostScale={hostScale}
        hostName={hostName}
        campaignId={campaignId}
        locations={locations}
        linkedLocationByCellId={draft.linkedLocationByCellId}
        objectsByCellId={draft.objectsByCellId}
        onClose={() => setDraft((d) => ({ ...d, cellModalCellId: null }))}
        onUpdateLinkedLocation={onUpdateLinkedLocation}
        onUpdateCellObjects={onUpdateCellObjects}
      />
    </>
  );
}
