import type { DistanceUnitId } from './distance.definitions';

/** Unit id for a distance value; derived from `DISTANCE_UNIT_DEFINITIONS`. */
export type DistanceUnit = DistanceUnitId;

export type Distance = {
  value: number;
  unit: DistanceUnit;
};
