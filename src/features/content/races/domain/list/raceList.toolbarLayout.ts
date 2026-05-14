import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Race list toolbar: no custom filters on primary — source / visibility / allowed on secondary (primary is search only).
 */
export const RACE_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: [],
  secondary: ['source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
