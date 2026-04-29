import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Location list toolbar: ids reference {@link buildLocationListFilters} + {@link makePostFilters}.
 */
export const LOCATION_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['scale', 'category'],
  secondary: ['source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
