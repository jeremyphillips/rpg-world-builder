import type { ViewerContext } from '@/shared/domain/capabilities';

import type { AppDataGridColumn } from '../types';
import { isAppDataGridVisibleToViewer } from './visibilityForViewer';

/**
 * Drops columns the current viewer is not allowed to see (see `visibility` on {@link AppDataGridColumn}).
 * Call in the route (or list page) after composing column definitions, before passing them to the grid.
 *
 * When `viewer` is undefined, **platformAdminOnly** columns are hidden.
 */
export function filterAppDataGridColumnsByVisibility<T>(
  columns: AppDataGridColumn<T>[],
  viewer: ViewerContext | undefined,
): AppDataGridColumn<T>[] {
  return columns.filter((column) => isAppDataGridVisibleToViewer(column.visibility, viewer));
}

/** @deprecated Use `filterAppDataGridColumnsByVisibility` instead. */
export const filterAppDataGridColumnsForViewer = filterAppDataGridColumnsByVisibility;
