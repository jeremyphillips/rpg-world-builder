/**
 * Structured facets for cell-fill **families** (see `authoredCellFillDefinitions.ts` for persisted
 * `{ familyId, variantId }` and swatch keys).
 *
 * These types describe *what* a fill is for authoring UX and future features (grouping, filters,
 * derived labels). They supplement the registry; they are not the persistence shape on each cell.
 *
 * @remarks **TODO (broader app wiring):** palette ordering, grouped pickers, filtering, and any
 * presentation derived from facets are **not** implemented yet. Current paint UI and combat underlay
 * still rely on explicit `swatchColorKey` from `resolveCellFillVariant`. Do not treat unused facets
 * as dead code — they are intentional scaffolding.
 */

import type { MaterialId } from '@/shared/domain/materials';

/**
 * Top-level bucket: outdoor/natural land cover vs interior constructed surfaces.
 * Keeps terrain-like fills (forest, water, …) separate from interior floor variants.
 */
export type LocationCellFillCategory = 'terrain' | 'surface';

/**
 * Kind of terrain or surface within {@link LocationCellFillCategory}.
 * Extend this union when new **families** are added to the authored registry.
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
 * @remarks **TODO:** runtime list for validation/selects when facets are wired up.
 */
export const LOCATION_CELL_FILL_MATERIAL_IDS = ['stone', 'wood', 'tile'] as const satisfies readonly MaterialId[];

export type LocationCellFillMaterialId = (typeof LOCATION_CELL_FILL_MATERIAL_IDS)[number];
