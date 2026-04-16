import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Monster list toolbar: ids reference {@link buildMonsterCustomFilters} + {@link makePostFilters}.
 */
export const MONSTER_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  rows: [
    ['monsterType', 'sizeCategory', 'challengeRating'],
    ['source', 'visibility', 'allowedInCampaign'],
  ],
  utilities: ['hideDisallowed'],
};
