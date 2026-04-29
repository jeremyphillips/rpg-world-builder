/**
 * Canonical defaults for legacy campaign spell documents missing nested SpellBase fields.
 * Also used as assembly fallbacks where appropriate.
 */
import type {
  SpellCastingTime,
  SpellComponents,
  SpellDuration,
  SpellRange,
} from '../../../../../src/features/content/spells/domain/types/spell.types';

export const DEFAULT_SPELL_DESCRIPTION = { full: '', summary: '' } as const;

export const DEFAULT_SPELL_CASTING_TIME: SpellCastingTime = {
  normal: { value: 1, unit: 'action' },
  canBeCastAsRitual: false,
};

export const DEFAULT_SPELL_RANGE: SpellRange = { kind: 'self' };

export const DEFAULT_SPELL_DURATION: SpellDuration = { kind: 'instantaneous' };

export const DEFAULT_SPELL_COMPONENTS: SpellComponents = {};
