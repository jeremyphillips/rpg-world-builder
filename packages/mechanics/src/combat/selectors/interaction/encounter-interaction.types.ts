export type GridInteractionMode =
  | 'select-target'
  | 'move'
  | 'aoe-place'
  | 'single-cell-place'
  /** Pick a grid object (`EncounterSpace.gridObjects`, legacy `obstacles`) for object-anchored attached emanations. */
  | 'object-anchor-select'
