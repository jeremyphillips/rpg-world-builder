/** Canonical path kinds (roads, rivers). Persisted on maps as `pathEntries[].kind`. */
export const LOCATION_MAP_PATH_KIND_IDS = ['road', 'river'] as const;

export type LocationMapPathKindId = (typeof LOCATION_MAP_PATH_KIND_IDS)[number];
