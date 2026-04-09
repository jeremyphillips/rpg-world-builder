/**
 * Canonical placed-object footprint for **layout** (square grid, Phase 3).
 * Dimensions are in **feet** only — not tactical occupancy or hit-testing.
 */
export type PlacedObjectFootprintFeet =
  | { kind: 'rect'; widthFt: number; depthFt: number }
  | { kind: 'circle'; diameterFt: number };

/**
 * Where the footprint layout box is anchored relative to the **author** cell (square grid).
 * Phase 3: **`cell_center`** only. Phase 5: **between_cells_*** place the **center** of the layout box on the
 * **midpoint of the shared edge** between this cell and the neighbor in that direction (visual overhang
 * into the neighbor; **not** tactical occupancy).
 */
export type PlacedObjectCellAnchorKind =
  | 'cell_center'
  | 'between_cells_e'
  | 'between_cells_w'
  | 'between_cells_n'
  | 'between_cells_s';
