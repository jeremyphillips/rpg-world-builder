/**
 * How a targeting effect selects subjects (spells, monster riders, etc.).
 */
export type TargetingEffectTarget =
  | 'one-creature'
  | 'one-dead-creature'
  | 'chosen-creatures'
  | 'creatures-in-area'
  | 'creatures-entered-during-move';

/** Narrow subset used on monster `MonsterSpecialAction` stat blocks. */
export type MonsterSpecialActionTarget = Extract<
  TargetingEffectTarget,
  'creatures-in-area' | 'creatures-entered-during-move'
>;
