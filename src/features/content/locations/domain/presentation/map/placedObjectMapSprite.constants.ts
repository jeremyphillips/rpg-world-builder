/**
 * Phase 4 — in-map sprite fit inside the Phase 3 footprint layout box (`layoutWidthPx` / `layoutHeightPx`).
 *
 * **`contain`** — preserves the art’s aspect ratio (letterboxing as needed). Avoids non-uniform stretch
 * (“rubber tables”) when PNG aspect differs from the footprint box. Product policy: do **not** switch
 * to `fill` / `scale-down` without updating this contract and artist docs.
 */
export const PLACED_OBJECT_MAP_SPRITE_OBJECT_FIT = 'contain' as const;
