import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Spell list toolbar: row ids reference {@link buildSpellCustomFilters} + {@link makePostFilters}.
 * Missing ids (e.g. `owned` when the viewer has no owned spells) are skipped at render time.
 */
export const SPELL_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['school', 'level', 'classes', 'owned'],
  secondary: ['resolutionStatus', 'source', 'visibility', 'allowedInCampaign'],
  utilities: ['hideDisallowed'],
};
