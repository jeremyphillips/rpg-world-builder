export const DISTANCE_UNIT_DEFINITIONS = [
  { id: 'ft', name: 'Feet', shortName: 'ft' },
  { id: 'mi', name: 'Miles', shortName: 'mi' },
] as const;

export type DistanceUnitId = (typeof DISTANCE_UNIT_DEFINITIONS)[number]['id'];

export type DistanceUnitDefinition = (typeof DISTANCE_UNIT_DEFINITIONS)[number];
