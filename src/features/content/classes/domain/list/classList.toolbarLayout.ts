import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Class list toolbar: primary — hit die / spellcasting / primary abilities; secondary — source, visibility, allowed.
 */
export const CLASS_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['hitDie', 'spellcasting', 'primaryAbilities'],
  secondary: ['source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
