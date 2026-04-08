/**
 * Phase 4 — in-map sprite fit inside the Phase 3 footprint layout box (`layoutWidthPx` / `layoutHeightPx`).
 *
 * **`contain`** — used when there is **no** resolved footprint box (fixed icon sizing): preserves aspect
 * ratio (letterboxing as needed). Avoids non-uniform stretch (“rubber tables”).
 *
 * **`cover`** — used when **`layoutWidthPx` / `layoutHeightPx`** are set (registry footprint): fills the
 * layout box so on-grid scale matches `widthFt` / `depthFt` visually; may crop raster edges if PNG
 * aspect or padding differs from the footprint rect. See `placed-objects-flow.md` (sprite fit).
 *
 * Do **not** switch legacy fixed-icon paths to `fill` / `scale-down` without updating docs.
 */
export const PLACED_OBJECT_MAP_SPRITE_OBJECT_FIT = 'contain' as const;

/** Applied when footprint layout px is resolved — fills the box for nominal scale on the grid. */
export const PLACED_OBJECT_MAP_SPRITE_OBJECT_FIT_FOOTPRINT = 'cover' as const;

/**
 * Uniform scale on resolved footprint **`layoutWidthPx` / `layoutHeightPx`** before paint so sprites sit
 * slightly inside the nominal box — reduces overlap with grid lines / cell chrome. Resolver math unchanged.
 */
export const PLACED_OBJECT_FOOTPRINT_RASTER_DISPLAY_INSET_SCALE = 0.97;
