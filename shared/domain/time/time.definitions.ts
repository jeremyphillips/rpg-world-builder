export const TIME_UNIT_DEFINITIONS = [
  { id: 'minute', name: 'Minute', shortName: 'min', shortLabel: 'min' },
  { id: 'hour', name: 'Hour', shortName: 'hr', shortLabel: 'hr' },
  { id: 'day', name: 'Day', shortName: 'day', shortLabel: 'day' },
  { id: 'week', name: 'Week', shortName: 'wk', shortLabel: 'wk' },
  { id: 'month', name: 'Month', shortName: 'mo', shortLabel: 'mo' },
  { id: 'year', name: 'Year', shortName: 'yr', shortLabel: 'yr' },
] as const;

export type TimeUnit = (typeof TIME_UNIT_DEFINITIONS)[number]['id'];

export type TimeUnitDefinition = (typeof TIME_UNIT_DEFINITIONS)[number];

/**
 * Subset of {@link TimeUnit} used for spell casting time (long casts), distinct from action-economy units.
 * Single place for these ids (avoid repeating literals next to {@link ActionEconomyKind} in spell types).
 */
export const SPELL_CASTING_TIME_DURATION_UNIT_IDS = ['minute', 'hour'] as const satisfies readonly TimeUnit[];

export type SpellCastingTimeDurationUnit =
  (typeof SPELL_CASTING_TIME_DURATION_UNIT_IDS)[number];
