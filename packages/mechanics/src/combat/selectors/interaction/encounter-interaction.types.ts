export type GridInteractionMode =
  | 'select-target'
  | 'move'
  | 'aoe-place'
  | 'single-cell-place'
  /** Pick a grid object (`EncounterSpace.gridObjects`) for object-anchored attached emanations. */
  | 'object-anchor-select'
  /** Pick an adjacent cell across a locked door for Pick Lock when multiple doors qualify. */
  | 'pick-lock-select'
