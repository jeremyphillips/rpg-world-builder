import type { ViewerContext } from '@/shared/domain/capabilities';

import type { AppDataGridFilter } from './types';

/**
 * Drops filters the current viewer is not allowed to see (see `visibility` on {@link AppDataGridFilter}).
 * Call in the route (or list page) after composing filter definitions, before passing them as
 * `toolbarConfig.filters.definitions` on `AppDataGrid`.
 *
 * When `viewer` is undefined, **platformAdminOnly** filters are hidden.
 */
export function filterAppDataGridFiltersForViewer<T>(
  filters: AppDataGridFilter<T>[],
  viewer: ViewerContext | undefined,
): AppDataGridFilter<T>[] {
  return filters.filter((f) => {
    const vis = f.visibility;
    if (!vis?.platformAdminOnly) return true;
    return Boolean(viewer?.isPlatformAdmin);
  });
}
