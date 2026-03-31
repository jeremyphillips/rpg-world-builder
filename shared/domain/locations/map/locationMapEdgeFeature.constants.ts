/** Canonical edge kinds (walls, openings on boundaries). Persisted on maps as `edgeEntries[].kind`. */
export const LOCATION_MAP_EDGE_KIND_IDS = ['wall', 'window', 'door'] as const;

export type LocationMapEdgeKindId = (typeof LOCATION_MAP_EDGE_KIND_IDS)[number];
