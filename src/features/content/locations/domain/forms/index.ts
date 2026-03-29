export type { LocationFormValues } from './types/locationForm.types';
export {
  getLocationFieldConfigs,
  LOCATION_FORM_DEFAULTS,
  type GetLocationFieldConfigsOptions,
} from './config/locationForm.config';
export {
  buildParentLocationPickerOptions,
  type BuildParentLocationPickerOptionsArgs,
} from './utils/parentLocationPickerOptions';
export {
  isCategoryAllowedForScale,
  isCellUnitAllowedForScale,
  normalizeCategoryForScale,
  normalizeGridCellUnitForScale,
} from '@/shared/domain/locations';
export {
  ALL_LOCATION_SCALE_OPTIONS,
  applyScaleToLocationFormUiPolicy,
  buildLocationFormUiPolicy,
  canSelectWorldScale,
  getAllowedCellUnitOptionsForScale,
  getAllowedLocationCategoryOptions,
  getAllowedLocationScaleOptionsForCreate,
  getAllowedParentLocationOptions,
  getAllowedParentScalesForScale,
  getFilteredParentLocationsForChildScale,
  getLocationScaleOptionsForEditDisplay,
  isAllowedParentLocation,
  isAllowedParentScale,
  isLocationScaleFieldEditable,
  isLocationScaleSelected,
  shouldShowCategoryFieldForScale,
  shouldShowGridCellUnitFieldForScale,
  shouldShowLocationCategoryField,
  shouldShowParentFieldForScale,
  shouldShowParentLocationField,
  type LocationFormUiMode,
  type LocationFormUiPolicy,
  type LocationFormUiPolicyBase,
} from './utils/locationFormUiRules';
export {
  getLocationFormPatchForScaleChange,
  sanitizeLocationDraftForScale,
  sanitizeLocationFormValues,
  type LocationFormSanitizeContext,
} from './utils/locationFormSanitize';
export {
  getDefaultCellUnitForScale,
  getDefaultMapKindForScale,
  getSanitizedCellUnitForScale,
  isCategoryValueAllowedForScale,
  isMapKindAllowedForScale,
  isParentIdAllowedForScale,
  shouldClearCategoryForScale,
  shouldClearParentForScale,
} from './utils/locationDependentFieldsPolicy';
export { locationToFormValues, toLocationInput } from './mappers/locationForm.mappers';
export { LOCATION_DETAIL_SPECS, type LocationDetailCtx } from '../details/locationDetail.spec';
