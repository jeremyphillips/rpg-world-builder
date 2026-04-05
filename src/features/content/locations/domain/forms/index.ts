export type { LocationFormValues } from './types/locationForm.types';
export {
  getLocationFieldConfigs,
  LOCATION_FORM_DEFAULTS,
  type GetLocationFieldConfigsOptions,
} from './config/locationForm.config';
export {
  buildParentLocationPickerOptions,
  type BuildParentLocationPickerOptionsArgs,
} from './rules/parentLocationPickerOptions';
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
  shouldShowCategoryChoiceInLocationSetup,
  shouldShowCategoryEditableInCreateRail,
  shouldShowCellUnitChoiceInLocationSetup,
  shouldShowCategoryFieldForScale,
  shouldShowGridCellUnitFieldForScale,
  shouldShowLocationCategoryField,
  shouldShowParentFieldForScale,
  shouldShowParentLocationField,
  type LocationFormUiMode,
  type LocationFormUiPolicy,
  type LocationFormUiPolicyBase,
} from './rules/locationFormUiRules';
export {
  buildLocationFormValuesFromSetup,
  type LocationCreateSetupDraft,
} from './setup/locationCreateSetupForm';
export {
  getDefaultGeometryForScale,
  normalizeGridGeometryForScale,
} from '@/shared/domain/locations';
export {
  getLocationFormPatchForScaleChange,
  sanitizeLocationDraftForScale,
  sanitizeLocationFormValues,
  type LocationFormSanitizeContext,
} from './rules/locationFormSanitize';
export {
  getDefaultCellUnitForScale,
  getDefaultMapKindForScale,
  getSanitizedCellUnitForScale,
  isCategoryValueAllowedForScale,
  isMapKindAllowedForScale,
  isParentIdAllowedForScale,
  shouldClearCategoryForScale,
  shouldClearParentForScale,
} from './rules/locationDependentFieldsPolicy';
export { locationToFormValues, toLocationInput } from './mappers/locationForm.mappers';
export { buildBuildingSubtypeSelectOptions } from './rules/buildingSubtypeSelectOptions';
export {
  buildCharacterEntityPickerOptions,
  characterRefsToPickerValues,
  decodeLocationEntityRef,
  encodeLocationEntityRef,
  pickerValuesToCharacterRefs,
} from './setup/locationEntityRefPicker';
export { LOCATION_DETAIL_SPECS, type LocationDetailCtx } from '../details/locationDetail.spec';
