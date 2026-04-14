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
