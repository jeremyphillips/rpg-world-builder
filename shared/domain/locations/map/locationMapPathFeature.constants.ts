/** Persisted path segment kinds (roads, rivers). Aligned with editor path vocabulary. */
export const LOCATION_MAP_PATH_FEATURE_KIND_IDS = ['road', 'river'] as const;

export type LocationMapPathFeatureKindId = (typeof LOCATION_MAP_PATH_FEATURE_KIND_IDS)[number];
