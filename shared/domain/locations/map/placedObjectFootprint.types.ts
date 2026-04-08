/**
 * Canonical placed-object footprint for **layout** (square grid, Phase 3).
 * Dimensions are in **feet** only — not tactical occupancy or hit-testing.
 */
export type PlacedObjectFootprintFeet =
  | { kind: 'rect'; widthFt: number; depthFt: number }
  | { kind: 'circle'; diameterFt: number };

/** Minimal anchor model for cell-placed objects (Phase 3). */
export type PlacedObjectCellAnchorKind = 'cell_center';
