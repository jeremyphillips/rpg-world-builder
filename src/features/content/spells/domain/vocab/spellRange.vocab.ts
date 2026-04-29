/**
 * Re-exports canonical spell range vocabulary from shared content vocab.
 * Prefer importing from `@/features/content/shared/domain/vocab` in new code.
 */

import type { SpellRangeDefinition, SpellRangeKind } from '@/features/content/shared/domain/vocab';

export type { SpellRangeDefinition, SpellRangeKind };

export {
  SPELL_RANGE_DEFINITION_BY_ID,
  SPELL_RANGE_DEFINITIONS,
  SPELL_RANGE_KINDS,
  getSpellRangeById,
  getSpellRangeKindName,
  getSpellRangeRulesText,
  getSpellRangeRulesTextForKey,
} from '@/features/content/shared/domain/vocab';

/** @deprecated Use {@link SpellRangeKind}. */
export type SpellRangeKindId = SpellRangeKind;
