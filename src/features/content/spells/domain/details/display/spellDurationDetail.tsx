import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

import type { Spell } from '@/features/content/spells/domain/types';
import { getRulesConcept } from '@/features/content/shared/domain/vocab/rulesConcepts.vocab';
import { AppBadge, AppTooltip } from '@/ui/primitives';
import {
  formatSpellDuration,
  spellDurationRequiresConcentration,
} from './spellDurationDisplay';

/**
 * Duration line for spell detail: formatted duration text, plus a concentration rules badge
 * (with SRD-style tooltip) when the spell’s duration requires concentration.
 */
export function renderSpellDurationDetailDisplay(spell: Spell): ReactNode {
  const needsConc = spellDurationRequiresConcentration(spell.duration);
  const text = formatSpellDuration(spell.duration, needsConc ? 'badge' : 'inline');

  if (!needsConc) {
    return text || '—';
  }

  const conc = getRulesConcept('concentration');
  const tooltipTitle = (
    <Box sx={{ maxWidth: 360, whiteSpace: 'pre-wrap', typography: 'body2' }}>
      {conc.rulesText}
    </Box>
  );

  return (
    <Box
      component="span"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    >
      <span>{text}</span>
      <AppTooltip title={tooltipTitle} placement="top">
        <Box component="span" sx={{ display: 'inline-flex', cursor: 'help' }}>
          <AppBadge label={conc.name} tone="info" size="small" />
        </Box>
      </AppTooltip>
    </Box>
  );
}
