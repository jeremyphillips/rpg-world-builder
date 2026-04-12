import type { ReactNode } from 'react';

import type { Spell } from '@/features/content/spells/domain/types';
import type { Effect, SaveEffect } from '@/features/mechanics/domain/effects/effects.types';
import { abilityIdToAbbrev, abilityIdToKey } from '@/features/mechanics/domain/character';

function findFirstTopLevelSaveEffect(effects: Effect[]): SaveEffect | undefined {
  for (const e of effects) {
    if (e.kind === 'save') return e;
  }
  return undefined;
}

export function formatSpellAttackSaveDisplay(spell: Spell): string {
  const dm = spell.deliveryMethod;
  if (dm === 'melee-spell-attack') return 'Melee attack';
  if (dm === 'ranged-spell-attack') return 'Ranged attack';

  const save = findFirstTopLevelSaveEffect(spell.effects);
  if (save) {
    const abbr = abilityIdToAbbrev(abilityIdToKey(save.save.ability));
    return `${abbr} save`;
  }

  return '—';
}

export function renderSpellAttackSaveDetailDisplay(spell: Spell): ReactNode {
  return formatSpellAttackSaveDisplay(spell);
}
