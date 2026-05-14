import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Monster list toolbar: ids reference {@link buildMonsterCustomFilters} + {@link makePostFilters}.
 */
export const MONSTER_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['monsterType', 'sizeCategory', 'challengeRating'],
  secondary: ['source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
