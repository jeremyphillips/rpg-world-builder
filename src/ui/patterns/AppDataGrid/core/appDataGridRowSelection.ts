import type { GridRowSelectionModel } from '@mui/x-data-grid'

/**
 * Maps MUI X `GridRowSelectionModel` to a flat list of selected row ids for the **currently visible** rows.
 * Supports `include` (explicit selection) and `exclude` (select-all with exceptions, e.g. header “select all”).
 */
export function rowSelectionModelToSelectedRowIds(
  model: GridRowSelectionModel,
  visibleRowIdsOrdered: string[],
): string[] {
  if (model.type === 'include') {
    return Array.from(model.ids, (id) => String(id))
  }
  const excluded = model.ids
  return visibleRowIdsOrdered.filter((id) => !excluded.has(id))
}

/** Builds an `include` selection model from string ids (matches `getRowId`). */
export function selectedRowIdsToRowSelectionModel(selectedRowIds: readonly string[]): GridRowSelectionModel {
  return { type: 'include', ids: new Set(selectedRowIds) }
}
