import type { AppDataGridFilter } from './types'

/**
 * Index filters by `id` for toolbar layout resolution. Warns in dev on duplicate ids.
 */
export function indexAppDataGridFiltersById<T>(
  filters: AppDataGridFilter<T>[],
): Map<string, AppDataGridFilter<T>> {
  const map = new Map<string, AppDataGridFilter<T>>()
  for (const f of filters) {
    if (map.has(f.id)) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console -- duplicate filter id is a dev-time contract violation
        console.warn(
          `[AppDataGrid] Duplicate filter id "${f.id}" — later entries are ignored for toolbar registry.`,
        )
      }
      continue
    }
    map.set(f.id, f)
  }
  return map
}
