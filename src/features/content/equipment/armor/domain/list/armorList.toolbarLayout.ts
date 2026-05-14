import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Armor list toolbar: ids reference {@link buildArmorCustomFilters} + {@link makePostFilters}.
 * Missing ids (e.g. `owned`) are skipped at render time.
 */
export const ARMOR_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['category', 'stealth'],
  secondary: ['owned', 'dmOwnedByCharacter', 'source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
