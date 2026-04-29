import type {
  SpellCastingTime,
  SpellComponents,
  SpellDuration,
  SpellRange,
} from '@/features/content/spells/domain/types';

export const SPELL_FORM_DEFAULT_CASTING_TIME: SpellCastingTime = {
  normal: { value: 1, unit: 'action' },
  canBeCastAsRitual: false,
};

export const SPELL_FORM_DEFAULT_RANGE: SpellRange = { kind: 'self' };

export const SPELL_FORM_DEFAULT_DURATION: SpellDuration = { kind: 'instantaneous' };

export const SPELL_FORM_DEFAULT_COMPONENTS: SpellComponents = {};
