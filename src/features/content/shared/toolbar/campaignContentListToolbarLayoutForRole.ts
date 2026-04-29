import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Strips PC-only vs DM-only toolbar filter ids so layout ids match the post-visibility filter set
 * (avoids dev warnings from {@link warnToolbarLayoutFilterIdsInDev} when `owned` or `dmOwnedByCharacter`
 * are omitted for the current viewer).
 */
export function campaignContentToolbarLayoutForRole(
  layout: AppDataGridToolbarLayout,
  canManage: boolean,
): AppDataGridToolbarLayout {
  const strip = (row: string[] | undefined) =>
    row?.filter((id) => {
      if (id === 'owned') return !canManage
      if (id === 'dmOwnedByCharacter') return canManage
      return true
    })

  return {
    primary: strip(layout.primary) ?? [],
    secondary: layout.secondary ? strip(layout.secondary) : undefined,
    utilities: layout.utilities,
  }
}
