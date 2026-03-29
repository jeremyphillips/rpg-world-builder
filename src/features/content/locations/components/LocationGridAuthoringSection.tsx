import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';

import GridEditor, { type GridCell } from '@/ui/patterns/grid/GridEditor';
import { parseGridCellId } from '@/shared/domain/grid/gridCellIds';
import { pruneExcludedCellIdsForGrid } from '@/features/content/locations/domain/maps/gridLayoutDraft';

import type { LocationGridDraftState } from './locationGridDraft.types';

type LocationGridAuthoringSectionProps = {
  gridColumns: string;
  gridRows: string;
  draft: LocationGridDraftState;
  setDraft: Dispatch<SetStateAction<LocationGridDraftState>>;
  maxHeight?: number | 'none';
};

export function LocationGridAuthoringSection({
  gridColumns,
  gridRows,
  draft,
  setDraft,
  maxHeight,
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
      const pruned = pruneExcludedCellIdsForGrid(prev.excludedCellIds, cols, rows);
      let nextSel = prev.selectedCellId;
      if (nextSel) {
        const p = parseGridCellId(nextSel);
        if (!p || p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows) {
          nextSel = null;
        }
      }
      const sameLen = pruned.length === prev.excludedCellIds.length;
      const sameIds =
        sameLen && pruned.every((id, i) => id === prev.excludedCellIds[i]);
      if (sameIds && nextSel === prev.selectedCellId) return prev;
      return { ...prev, excludedCellIds: pruned, selectedCellId: nextSel };
    });
  }, [validPreview, cols, rows, setDraft]);

  if (!validPreview) return null;

  const onCellClick = (cell: GridCell) => {
    setDraft((d) => ({ ...d, selectedCellId: cell.cellId }));
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

  const selectedParsed = draft.selectedCellId
    ? parseGridCellId(draft.selectedCellId)
    : null;
  const selectedExcluded = draft.selectedCellId
    ? draft.excludedCellIds.includes(draft.selectedCellId)
    : false;
  const excludedCount = draft.excludedCellIds.length;

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
            Click a cell to select it and mark cells excluded from the walkable layout.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
