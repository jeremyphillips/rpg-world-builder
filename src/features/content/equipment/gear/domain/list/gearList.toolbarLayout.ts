import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Gear list toolbar: ids reference {@link buildGearCustomFilters} + {@link makePostFilters}.
 * Missing ids (e.g. `owned`) are skipped at render time.
 */
export const GEAR_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['category'],
  secondary: ['owned', 'dmOwnedByCharacter', 'source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
