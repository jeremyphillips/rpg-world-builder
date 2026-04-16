import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Magic item list toolbar: ids reference {@link buildMagicItemCustomFilters} + {@link makePostFilters}.
 * Missing ids (e.g. `owned`) are skipped at render time.
 */
export const MAGIC_ITEM_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['slot', 'rarity', 'attunement', 'owned'],
  secondary: ['source', 'visibility', 'allowedInCampaign'],
  utilities: ['hideDisallowed'],
};
