import type { SpellDuration } from '../types/spell.types';

/**
 * Display labels for spell duration discriminant `kind` (the union on {@link SpellDuration}).
 * Timed and turn-boundary durations are usually formatted with more context than the kind name alone.
 */
export const SPELL_DURATION_KIND_OPTIONS = [
  { id: 'instantaneous', name: 'Instantaneous' },
  { id: 'timed', name: 'Timed' },
  { id: 'until-turn-boundary', name: 'Until turn boundary' },
  { id: 'until-dispelled', name: 'Until dispelled' },
  { id: 'until-triggered', name: 'Until triggered' },
  { id: 'special', name: 'Special' },
] as const satisfies readonly { id: SpellDuration['kind']; name: string }[];

export type SpellDurationKindId = (typeof SPELL_DURATION_KIND_OPTIONS)[number]['id'];

const SPELL_DURATION_KIND_NAME = new Map<string, string>(
  SPELL_DURATION_KIND_OPTIONS.map((o) => [o.id, o.name] as const),
);

/** Short label for a duration kind, e.g. filters or fallback text. */
export function getSpellDurationKindName(kind: SpellDurationKindId): string {
  return SPELL_DURATION_KIND_NAME.get(kind) ?? kind;
}
