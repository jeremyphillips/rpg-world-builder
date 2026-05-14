import type { AppDataGridToolbarLayout } from '@/ui/patterns';

/**
 * Spell list toolbar: row ids reference {@link buildSpellCustomFilters} + {@link makePostFilters}
 * (incl. `patched`, gated like detail meta: DM / co-DM or platform admin).
 * Missing ids (e.g. `owned` when the viewer has no owned spells) are skipped at render time.
 */
export const SPELL_LIST_TOOLBAR_LAYOUT: AppDataGridToolbarLayout = {
  primary: ['school', 'level', 'classes'],
  secondary: [
    'owned',
    'dmOwnedByCharacter',
    'resolutionStatus',
    'source',
    'visibility',
    'allowedInCampaign',
    'patched',
  ],
  utilities: ['hideDisallowed'],
};
