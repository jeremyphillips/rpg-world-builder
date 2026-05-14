import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Weapon list toolbar: ids reference {@link buildWeaponCustomFilters} + {@link makePostFilters}.
 * Missing ids (e.g. `owned`) are skipped at render time.
 */
export const WEAPON_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['category', 'property'],
  secondary: ['owned', 'dmOwnedByCharacter', 'source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
