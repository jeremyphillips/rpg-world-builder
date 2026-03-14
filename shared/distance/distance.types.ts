export type DistanceUnit = 'ft' | 'mi';

export type Distance = {
  value: number;
  unit: DistanceUnit;
};