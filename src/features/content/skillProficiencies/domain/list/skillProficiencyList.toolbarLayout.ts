import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Skill proficiency list toolbar: row ids reference {@link buildSkillProficiencyCustomFilters} + {@link makePostFilters}.
 * Missing ids (e.g. `owned` when the viewer has no proficiencies) are skipped at render time.
 */
export const SKILL_PROFICIENCY_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['ability', 'suggestedClasses', 'tags'],
  secondary: ['owned', 'dmOwnedByCharacter', 'source', 'visibility', 'allowedInCampaign', 'patched'],
  utilities: ['hideDisallowed'],
};
