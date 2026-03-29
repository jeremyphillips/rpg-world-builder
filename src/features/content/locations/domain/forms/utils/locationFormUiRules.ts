/**
 * Shared UI enforcement for location create/edit — drives both routes (no duplicated conditionals).
 */
import {
  CELL_UNITS_BY_KIND,
  LOCATION_CATEGORY_IDS,
  LOCATION_SCALE_ORDER,
  mapKindForLocationScale,
} from '@/shared/domain/locations';
import { filterLocationsEligibleAsParent } from '@/shared/domain/locations/locationScale.rules';
import type { Location } from '@/features/content/locations/domain/types';

export type LocationFormUiMode = 'create' | 'edit';

export const ALL_LOCATION_SCALE_OPTIONS = LOCATION_SCALE_ORDER.map((s) => ({
  value: s,
  label: s,
}));

export function getAllowedLocationScaleOptionsForCreate(campaignHasWorldLocation: boolean) {
  return LOCATION_SCALE_ORDER.filter((s) => s !== 'world' || !campaignHasWorldLocation).map((s) => ({
    value: s,
    label: s,
  }));
}

/** Edit: show full scale list for display; field is disabled so selection cannot change. */
export function getLocationScaleOptionsForEditDisplay() {
  return ALL_LOCATION_SCALE_OPTIONS;
}

export function canSelectWorldScale(campaignHasWorldLocation: boolean): boolean {
  return !campaignHasWorldLocation;
}

export function shouldShowLocationCategoryField(scale: string): boolean {
  return scale !== 'world';
}

export function getAllowedLocationCategoryOptions(scale: string) {
  if (scale === 'world') return [];
  return LOCATION_CATEGORY_IDS.map((c) => ({
    value: c,
    label: c.slice(0, 1).toUpperCase() + c.slice(1),
  }));
}

export function shouldShowParentLocationField(scale: string): boolean {
  return scale !== 'world';
}

export function getFilteredParentLocationsForChildScale(
  locations: Location[],
  childScale: string,
  excludeLocationId?: string,
): Location[] {
  const eligible = filterLocationsEligibleAsParent(locations, childScale);
  if (!excludeLocationId) return eligible;
  return eligible.filter((l) => l.id !== excludeLocationId);
}

export function isLocationScaleFieldEditable(mode: LocationFormUiMode): boolean {
  return mode === 'create';
}

export function getAllowedCellUnitOptionsForScale(scale: string): { value: string; label: string }[] {
  const kind = mapKindForLocationScale(scale);
  return CELL_UNITS_BY_KIND[kind].map((u) => ({ value: u, label: u }));
}

export type LocationFormUiPolicy = {
  mode: LocationFormUiMode;
  scaleSelectOptions: { value: string; label: string }[];
  scaleFieldDisabled: boolean;
  showCategoryField: boolean;
  showParentField: boolean;
};

export type LocationFormUiPolicyBase = Omit<
  LocationFormUiPolicy,
  'showCategoryField' | 'showParentField'
>;

export function buildLocationFormUiPolicy(
  mode: LocationFormUiMode,
  campaignHasWorldLocation: boolean,
): LocationFormUiPolicyBase {
  return {
    mode,
    scaleSelectOptions:
      mode === 'create'
        ? getAllowedLocationScaleOptionsForCreate(campaignHasWorldLocation)
        : getLocationScaleOptionsForEditDisplay(),
    scaleFieldDisabled: !isLocationScaleFieldEditable(mode),
  };
}

/** Apply scale-specific visibility (category/parent hidden for world). */
export function applyScaleToLocationFormUiPolicy(
  base: LocationFormUiPolicyBase,
  scale: string,
): LocationFormUiPolicy {
  return {
    ...base,
    showCategoryField: shouldShowLocationCategoryField(scale),
    showParentField: shouldShowParentLocationField(scale),
  };
}
