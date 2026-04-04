/**
 * Structured facets for **concrete** cell fill kinds (`LOCATION_CELL_FILL_KIND_META` keys).
 *
 * These fields describe *what* a fill is for authoring UX and future features (grouping, filters,
 * derived labels). They do **not** replace stored fill ids — persistence and tools still use the
 * flat id per cell (e.g. `forest_light`, `stone_floor`).
 *
 * @remarks **TODO (broader app wiring):** palette ordering, grouped pickers, filtering, and any
 * presentation derived from facets are **not** implemented yet. Current paint UI and combat underlay
 * still rely on explicit `swatchColorKey` and the concrete id. Do not treat unused facets as dead
 * code — they are intentional scaffolding.
 */

import type { MaterialId } from '@/shared/domain/materials';

/**
 * Top-level bucket: outdoor/natural land cover vs interior constructed surfaces.
 * Keeps terrain-like fills (forest, water, …) separate from floors (`stone_floor`, future `wood_floor`).
 */
export type LocationCellFillCategory = 'terrain' | 'surface';

/**
 * Kind of terrain or surface within {@link LocationCellFillCategory}.
 * Extend this union when new **families** of concrete fills are added (e.g. `forest_tropical_*`).
 */
export type LocationCellFillFamily =
  | 'mountains'
  | 'plains'
  | 'forest'
  | 'swamp'
  | 'desert'
  | 'water'
  /** Interior flooring (paired with {@link LocationCellFillMaterialId} on `surface` fills). */
  | 'floor';

/**
 * Optional climate / ecology hint for terrain fills.
 * Omit when not meaningful (e.g. abstract `water` body).
 *
 * @remarks **TODO:** not yet read by palette or validation; reserved for future grouping/filters.
 */
export type LocationCellFillBiome = 'temperate' | 'arid' | 'tropical';

/**
 * Land cover or canopy density for terrain where it matters (e.g. forest variants).
 * Omit for fills where density is not a useful axis (swamp, water, plains as a single id).
 *
 * @remarks **TODO:** not yet used for UI; naming alignment only for now.
 */
export type LocationCellFillDensity = 'open' | 'dense';

/**
 * Materials allowed for interior floor surface fills. Subset of {@link MaterialId}.
 *
 * @remarks **TODO:** only `stone` is used in meta today; `wood` / `tile` support future ids like `wood_floor`
 * without schema churn. Runtime list for validation/selects when facets are wired up.
 */
export const LOCATION_CELL_FILL_MATERIAL_IDS = ['stone', 'wood', 'tile'] as const satisfies readonly MaterialId[];

export type LocationCellFillMaterialId = (typeof LOCATION_CELL_FILL_MATERIAL_IDS)[number];
