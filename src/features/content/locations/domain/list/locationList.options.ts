import { LOCATION_SCALE_ORDER } from '@/shared/domain/locations';

export const LOCATION_SCALE_FILTER_OPTIONS = LOCATION_SCALE_ORDER.map((s) => ({
  value: s,
  label: s,
}));

export const LOCATION_SOURCE_FILTER_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'campaign', label: 'Campaign' },
] as const;
