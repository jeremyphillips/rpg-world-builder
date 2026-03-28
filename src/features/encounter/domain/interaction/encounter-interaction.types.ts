export type GridInteractionMode =
  | 'select-target'
  | 'move'
  | 'aoe-place'
  | 'single-cell-place'
  /** Pick a grid obstacle (`EncounterSpace.obstacles`) for object-anchored attached emanations. */
  | 'object-anchor-select'
