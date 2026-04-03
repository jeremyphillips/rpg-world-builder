/**
 * Facet vocabularies for **base** edge feature kinds (`wall`, `window`, `door`).
 *
 * Persisted map data still stores the flat `kind` only today; these unions describe allowed
 * future variation (material, style, lock state, …) without exploding ids like `wall_stone`.
 *
 * @remarks **TODO (broader wiring):** authoring UI, validation, rendering, and combat/simulation
 * do **not** yet read or persist per-edge facet instances. `LOCATION_EDGE_FEATURE_KIND_META`
 * declares **supported** values per base kind as scaffolding only.
 */

import type { MaterialId } from '@/shared/domain/materials';

/**
 * High-level role of the edge feature for future grouping/filtering.
 *
 * @remarks **TODO:** not consumed by palette or overlays yet.
 */
export type LocationEdgeFeatureCategory = 'barrier' | 'opening' | 'passage';

/**
 * Materials allowed for map edge features (walls). Subset of {@link MaterialId}.
 * @remarks Runtime list for validation/UI; keep aligned with {@link MATERIAL_META} spellings.
 */
export const LOCATION_EDGE_MATERIAL_IDS = ['stone', 'wood'] as const satisfies readonly MaterialId[];

export type LocationEdgeMaterialId = (typeof LOCATION_EDGE_MATERIAL_IDS)[number];

/**
 * Window presentation / state variants.
 *
 * @remarks **TODO:** `window` edges are still a single visual; variants are not selectable yet.
 */
export type LocationWindowVariantId = 'glass' | 'stained_glass' | 'open' | 'bars' | 'shutters';

/**
 * Door lock / security state.
 *
 * @remarks **TODO:** no lock semantics in simulation from map edges in this pass.
 */
export type LocationDoorLockStateId = 'unlocked' | 'locked' | 'barred';

/**
 * Door width / leaf count.
 *
 * @remarks **TODO:** geometry and passage rules still ignore width.
 */
export type LocationDoorWidthId = 'single' | 'double';
