import { CAMPAIGN_LOCATION_LIST_SCALE_IDS } from '@/shared/domain/locations';

/**
 * Campaign list **filter chips** — intentionally includes legacy zone-like scales so old persisted rows are
 * filterable; not the same set as new-location create options (`CONTENT_LOCATION_SCALE_IDS` / surface subset).
 * Excludes floor/room (interior list UX is separate).
 */
export const LOCATION_SCALE_FILTER_OPTIONS = CAMPAIGN_LOCATION_LIST_SCALE_IDS.map((s) => ({
  value: s,
  label: s,
}));

export const LOCATION_SOURCE_FILTER_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'campaign', label: 'Campaign' },
] as const;
