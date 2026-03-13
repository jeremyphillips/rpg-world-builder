import { ABILITIES } from './abilities';

export type Ability = (typeof ABILITIES)[number];
export type AbilityId = (typeof ABILITIES)[number]['id'];
export type AbilityKey = (typeof ABILITIES)[number]['key'];
export type AbilityName = (typeof ABILITIES)[number]['name'];

export type AbilityScoreValue =
  | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15
  | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25;

  export type AbilityScores = Record<AbilityKey, AbilityScoreValue | null>

  export type AbilityScoreMap = Record<AbilityKey, AbilityScoreValue | null> | Record<AbilityId, AbilityScoreValue | null>;

  export type AbilityScoreMapResolved = Record<AbilityKey, AbilityScoreValue>  | Record<AbilityId, AbilityScoreValue>;  