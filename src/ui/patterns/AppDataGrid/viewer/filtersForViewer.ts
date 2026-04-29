import type { ViewerContext } from '@/shared/domain/capabilities';

import type { AppDataGridFilter } from '../types';
import { isAppDataGridVisibleToViewer } from './visibilityForViewer';

/**
 * Drops filters the current viewer is not allowed to see (see `visibility` on {@link AppDataGridFilter}).
 * Call in the route (or list page) after composing filter definitions, before passing them as
 * `toolbarConfig.filters.definitions` on `AppDataGrid`.
 *
 * When `viewer` is undefined, **platformAdminOnly** filters are hidden.
 */
export function filterAppDataGridFiltersByVisibility<T>(
  filters: AppDataGridFilter<T>[],
  viewer: ViewerContext | undefined,
): AppDataGridFilter<T>[] {
  return filters.filter((filter) => isAppDataGridVisibleToViewer(filter.visibility, viewer));
}

/** @deprecated Use `filterAppDataGridFiltersByVisibility` instead. */
export const filterAppDataGridFiltersForViewer = filterAppDataGridFiltersByVisibility;
