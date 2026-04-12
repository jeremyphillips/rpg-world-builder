import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

import type { Spell } from '@/features/content/spells/domain/types';
import { getRulesConcept } from '@/features/content/shared/domain/vocab/rulesConcepts.vocab';
import { AppBadge, AppTooltip } from '@/ui/primitives';
import {
  formatSpellCastingTimeDisplay,
  spellCastingTimeHasRitual,
} from './spellCastingTimeDisplay';

/**
 * Casting time line: formatted text plus a ritual rules badge (with tooltip) when the spell can be cast as a ritual.
 */
export function renderSpellCastingTimeDetailDisplay(spell: Spell): ReactNode {
  const text = formatSpellCastingTimeDisplay(spell);
  const isRitual = spellCastingTimeHasRitual(spell.castingTime);

  if (!isRitual) {
    return text || '—';
  }

  const ritual = getRulesConcept('ritual');
  const tooltipTitle = (
    <Box sx={{ maxWidth: 360, whiteSpace: 'pre-wrap', typography: 'body2' }}>
      {ritual.rulesText}
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
          <AppBadge label={ritual.name} tone="info" size="small" />
        </Box>
      </AppTooltip>
    </Box>
  );
}
