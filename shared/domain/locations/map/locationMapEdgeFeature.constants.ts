/**
 * Canonical **base** edge kinds (walls, openings on boundaries). Persisted on maps as `edgeEntries[].kind`.
 * Finer variation (material, window style, door lock, …) is modeled via facet vocabularies in
 * `locationEdgeFeature.facets.ts` and supported lists on feature `LOCATION_EDGE_FEATURE_KIND_META` — not
 * as additional top-level ids in this tuple.
 */
export const LOCATION_MAP_EDGE_KIND_IDS = ['wall', 'window', 'door'] as const;

export type LocationMapEdgeKindId = (typeof LOCATION_MAP_EDGE_KIND_IDS)[number];
