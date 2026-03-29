/**
 * Shared UI enforcement for location create/edit — drives both routes (no duplicated conditionals).
 * Field visibility and options derive from `LOCATION_SCALE_FIELD_POLICY` (shared).
 */
import {
  getAllowedCategoryOptionsForScale,
  getAllowedCellUnitOptionsForScale,
  isCategoryFieldReadOnlyForScale,
  isGridCellUnitFieldReadOnlyForScale,
  isLocationScaleEditableOnEdit,
  LOCATION_SCALE_ORDER,
  shouldShowCategoryFieldForScale,
  shouldShowGridCellUnitFieldForScale,
  shouldShowParentFieldForScale,
} from '@/shared/domain/locations';
import {
  getAllowedParentLocationOptions,
  getAllowedParentScalesForScale,
  isAllowedParentLocation,
  isAllowedParentScale,
} from '@/shared/domain/locations';
import { getFilteredParentLocationsForChildScale } from './locationDependentFieldsPolicy';

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

/** True when `scale` is a non-empty member of {@link LOCATION_SCALE_ORDER} (form + grid authoring gate). */
export function isLocationScaleSelected(scale: string | undefined | null): boolean {
  if (scale == null || scale === '') return false;
  return (LOCATION_SCALE_ORDER as readonly string[]).includes(scale);
}

/** @deprecated use {@link shouldShowCategoryFieldForScale} from shared policy */
export function shouldShowLocationCategoryField(scale: string): boolean {
  return shouldShowCategoryFieldForScale(scale);
}

export function getAllowedLocationCategoryOptions(scale: string) {
  return getAllowedCategoryOptionsForScale(scale);
}

/** @deprecated use {@link shouldShowParentFieldForScale} from shared policy */
export function shouldShowParentLocationField(scale: string): boolean {
  return shouldShowParentFieldForScale(scale);
}

export {
  getAllowedParentLocationOptions,
  getAllowedParentScalesForScale,
  isAllowedParentLocation,
  isAllowedParentScale,
  getFilteredParentLocationsForChildScale,
  getAllowedCellUnitOptionsForScale,
};

export function isLocationScaleFieldEditable(mode: LocationFormUiMode): boolean {
  return mode === 'create';
}

export type LocationFormUiPolicy = {
  mode: LocationFormUiMode;
  scaleSelectOptions: { value: string; label: string }[];
  scaleFieldDisabled: boolean;
  showCategoryField: boolean;
  showParentField: boolean;
  showGridCellUnitField: boolean;
  categorySelectOptions: { value: string; label: string }[];
  /** When true, category `<Select>` is display-only (fixed category scales). */
  categoryFieldDisabled: boolean;
  /** When true, cell unit `<Select>` is display-only (fixed or single unit). */
  gridCellUnitFieldDisabled: boolean;
};

export type LocationFormUiPolicyBase = Omit<
  LocationFormUiPolicy,
  | 'showCategoryField'
  | 'showParentField'
  | 'showGridCellUnitField'
  | 'categorySelectOptions'
  | 'categoryFieldDisabled'
  | 'gridCellUnitFieldDisabled'
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

/** Apply scale-specific visibility and option lists from centralized policy. */
export function applyScaleToLocationFormUiPolicy(
  base: LocationFormUiPolicyBase,
  scale: string,
): LocationFormUiPolicy {
  return {
    ...base,
    showCategoryField: shouldShowCategoryFieldForScale(scale),
    showParentField: shouldShowParentFieldForScale(scale),
    showGridCellUnitField: shouldShowGridCellUnitFieldForScale(scale),
    categorySelectOptions: getAllowedCategoryOptionsForScale(scale),
    categoryFieldDisabled: isCategoryFieldReadOnlyForScale(scale),
    gridCellUnitFieldDisabled: isGridCellUnitFieldReadOnlyForScale(scale),
    scaleFieldDisabled:
      base.mode === 'edit' ? !isLocationScaleEditableOnEdit(scale) : false,
  };
}

export {
  shouldShowCategoryFieldForScale,
  shouldShowGridCellUnitFieldForScale,
  shouldShowParentFieldForScale,
} from '@/shared/domain/locations';
