/** Persisted edge feature kinds (walls, openings on cell boundaries). */
export const LOCATION_MAP_EDGE_FEATURE_KIND_IDS = ['wall', 'window', 'door'] as const;

export type LocationMapEdgeFeatureKindId = (typeof LOCATION_MAP_EDGE_FEATURE_KIND_IDS)[number];
