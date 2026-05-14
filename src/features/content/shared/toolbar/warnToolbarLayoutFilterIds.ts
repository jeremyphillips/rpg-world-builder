import type { AppDataGridFilter, AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Logs a dev warning when `toolbarLayout` references filter ids that are not in `definitions`.
 * Does not validate `utilities` entries (they are not filter ids).
 */
export function warnToolbarLayoutFilterIdsInDev<T>(
  toolbarLayout: AppDataGridToolbarLayout | undefined,
  filters: AppDataGridFilter<T>[],
  contextLabel = 'ContentTypeListPage',
): void {
  if (!import.meta.env.DEV || !toolbarLayout) return;
  const ids = new Set(filters.map((f) => f.id));
  const check = (row: string[] | undefined, name: string) => {
    if (!row) return;
    for (const id of row) {
      if (!ids.has(id)) {
        // eslint-disable-next-line no-console -- intentional dev-only diagnostics
        console.warn(
          `[${contextLabel}] toolbar layout ${name} references unknown filter id "${id}" (not in filter definitions).`,
        );
      }
    }
  };
  check(toolbarLayout.primary, 'primary');
  check(toolbarLayout.secondary, 'secondary');
}
