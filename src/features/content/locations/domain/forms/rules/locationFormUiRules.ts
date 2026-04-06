/**
 * Shared UI enforcement for location create/edit — drives both routes (no duplicated conditionals).
 * Field visibility and options derive from `LOCATION_SCALE_FIELD_POLICY` (shared).
 */
import {
  LOCATION_SCALE_IDS_WITH_LEGACY,
  getAllowedCategoryOptionsForScale,
  getAllowedCellUnitOptionsForScale,
  isCategoryFieldReadOnlyForScale,
  isGridCellUnitFieldReadOnlyForScale,
  isLocationScaleEditableOnEdit,
  isValidLocationScaleId,
  shouldShowCategoryFieldForScale,
  shouldShowGridCellUnitFieldForScale,
  shouldShowParentFieldForScale,
  SURFACE_CONTENT_LOCATION_SCALE_IDS,
} from '@/shared/domain/locations';
import {
  getAllowedParentLocationOptions,
  getAllowedParentScalesForScale,
  isAllowedParentLocation,
  isAllowedParentScale,
} from '@/shared/domain/locations';
import { getFilteredParentLocationsForChildScale } from './locationDependentFieldsPolicy';

export type LocationFormUiMode = 'create' | 'edit';

/**
 * Read-only scale options for **edit** display — derived from `LOCATION_SCALE_IDS_WITH_LEGACY` so legacy
 * `region` / `subregion` / `district` rows still render. **Create** uses `getAllowedLocationScaleOptionsForCreate`
 * (content/surface only).
 */
export const LOCATION_SCALE_OPTIONS_WITH_LEGACY = LOCATION_SCALE_IDS_WITH_LEGACY.map((s) => ({
  value: s,
  label: s,
}));

/**
 * Create flow: **surface** scales only (world, city, site, building) — no floor/room (building
 * interior) or legacy map-zone scales. Policy: `SURFACE_CONTENT_LOCATION_SCALE_IDS` +
 * `locationScaleUi.policy.ts`.
 */
export function getAllowedLocationScaleOptionsForCreate(campaignHasWorldLocation: boolean) {
  return SURFACE_CONTENT_LOCATION_SCALE_IDS.filter(
    (s) => s !== 'world' || !campaignHasWorldLocation,
  ).map((s) => ({
    value: s,
    label: s,
  }));
}

/** Edit: show full scale list for display; field is disabled so selection cannot change. */
export function getLocationScaleOptionsForEditDisplay() {
  return LOCATION_SCALE_OPTIONS_WITH_LEGACY;
}

export function canSelectWorldScale(campaignHasWorldLocation: boolean): boolean {
  return !campaignHasWorldLocation;
}

/** True when `scale` is a known location scale (form + grid authoring gate). */
export function isLocationScaleSelected(scale: string | undefined | null): boolean {
  if (scale == null || scale === '') return false;
  return isValidLocationScaleId(scale);
}

/** Setup modal: show category control only when more than one allowed option exists. */
export function shouldShowCategoryChoiceInLocationSetup(scale: string): boolean {
  return getAllowedCategoryOptionsForScale(scale).length > 1;
}

/** Setup modal: show cell unit control only when more than one allowed option exists. */
export function shouldShowCellUnitChoiceInLocationSetup(scale: string): boolean {
  return getAllowedCellUnitOptionsForScale(scale).length > 1;
}

/** Create rail (post-setup): category `<Select>` only when multiple choices and not policy-fixed. */
export function shouldShowCategoryEditableInCreateRail(scale: string): boolean {
  return (
    shouldShowCategoryFieldForScale(scale) &&
    getAllowedCategoryOptionsForScale(scale).length > 1 &&
    !isCategoryFieldReadOnlyForScale(scale)
  );
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
