import { createElement, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import GridEditor, { type GridCell } from '@/ui/patterns/grid/GridEditor';
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

import { LocationGridCellModal } from './LocationGridCellModal';
import type { LocationCellObjectDraft, LocationGridDraftState } from './locationGridDraft.types';

type LocationGridAuthoringSectionProps = {
  gridColumns: string;
  gridRows: string;
  draft: LocationGridDraftState;
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  maxHeight?: number | 'none';
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
  draft,
  setDraft,
  maxHeight,
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

  const selectedParsed = draft.selectedCellId
    ? parseGridCellId(draft.selectedCellId)
    : null;
  const selectedExcluded = draft.selectedCellId
    ? draft.excludedCellIds.includes(draft.selectedCellId)
    : false;
  const excludedCount = draft.excludedCellIds.length;

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

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Layout preview — {cols} × {rows}
        {excludedCount > 0 ? ` · ${excludedCount} excluded` : ''}
      </Typography>
      <Box sx={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : 'none', overflow: 'auto' }}>
        <GridEditor
          columns={cols}
          rows={rows}
          selectedCellId={draft.selectedCellId}
          excludedCellIds={draft.excludedCellIds}
          onCellClick={onCellClick}
          renderCellContent={renderMapCellIcons}
        />
      </Box>
      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {draft.selectedCellId && selectedParsed ? (
          <>
            <Typography variant="caption" color="text.secondary" component="div">
              Cell <strong>{draft.selectedCellId}</strong> — x {selectedParsed.x}, y{' '}
              {selectedParsed.y}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={selectedExcluded}
                  onChange={toggleExcludedForSelected}
                  inputProps={{ 'aria-label': 'Exclude cell from layout' }}
                />
              }
              label="Excluded from layout"
            />
          </>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Click a cell to edit links and objects, or mark cells excluded from the walkable layout.
          </Typography>
        )}
      </Stack>

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
    </Paper>
  );
}
