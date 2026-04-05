/**
 * Location form values ↔ domain input.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type {
  LocationBuildingFunctionId,
  LocationBuildingPrimarySubtypeId,
  LocationBuildingPrimaryTypeId,
  LocationBuildingProfile,
} from '@/shared/domain/locations';
import type { Location, LocationInput } from '@/features/content/locations/domain/model/location';
import {
  characterRefsToPickerValues,
  pickerValuesToCharacterRefs,
} from '@/features/content/locations/domain/forms/setup/locationEntityRefPicker';
import {
  buildDefaultFormValues,
  buildToFormValues,
  buildToInput,
} from '@/features/content/shared/forms/registry';
import { LOCATION_FORM_FIELDS } from '../registry/locationForm.registry';
import type { LocationFormValues } from '../types/locationForm.types';
import { sanitizeLocationFormValues } from '@/features/content/locations/domain/forms/rules/locationFormSanitize';

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const toInput = buildToInput(LOCATION_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(LOCATION_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(LOCATION_FORM_FIELDS);

function buildingProfileFromFormValues(values: LocationFormValues): LocationBuildingProfile | undefined {
  if (trim(values.scale) !== 'building') return undefined;
  const primaryType = trim(values.buildingPrimaryType);
  const primarySubtype = trim(values.buildingPrimarySubtype);
  const functions = values.buildingFunctions ?? [];
  const isPublic = Boolean(values.buildingIsPublicStorefront);
  const ownerRefs = pickerValuesToCharacterRefs(values.buildingOwnerRefs ?? []);
  const staffRefs = pickerValuesToCharacterRefs(values.buildingStaffRefs ?? []);
  if (
    !primaryType &&
    !primarySubtype &&
    functions.length === 0 &&
    !isPublic &&
    ownerRefs.length === 0 &&
    staffRefs.length === 0
  ) {
    return undefined;
  }
  return {
    primaryType: (primaryType || undefined) as LocationBuildingPrimaryTypeId | undefined,
    primarySubtype: (primarySubtype || undefined) as LocationBuildingPrimarySubtypeId | undefined,
    functions: functions.length ? (functions as LocationBuildingFunctionId[]) : undefined,
    isPublicStorefront: isPublic || undefined,
    ownerRefs: ownerRefs.length ? ownerRefs : undefined,
    staffRefs: staffRefs.length ? staffRefs : undefined,
  };
}

export const locationToFormValues = (loc: Location): LocationFormValues => ({
  ...(defaultFormValues as LocationFormValues),
  ...toFormValuesFromItem(loc as Location & Record<string, unknown>),
  accessPolicy: (loc.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as LocationFormValues['accessPolicy'],
  labelShort: loc.label?.short ?? '',
  labelNumber: loc.label?.number ?? '',
  sortOrder: loc.sortOrder != null ? String(loc.sortOrder) : '',
  aliases: (loc.aliases ?? []).join(', '),
  tags: (loc.tags ?? []).join(', '),
  buildingPrimaryType: loc.buildingProfile?.primaryType ?? '',
  buildingPrimarySubtype: loc.buildingProfile?.primarySubtype ?? '',
  buildingFunctions: loc.buildingProfile?.functions ? [...loc.buildingProfile.functions] : [],
  buildingIsPublicStorefront: Boolean(loc.buildingProfile?.isPublicStorefront),
  buildingOwnerRefs: characterRefsToPickerValues(loc.buildingProfile?.ownerRefs),
  buildingStaffRefs: characterRefsToPickerValues(loc.buildingProfile?.staffRefs),
});

export const toLocationInput = (values: LocationFormValues): LocationInput => {
  const scale = trim(values.scale);
  const patch = sanitizeLocationFormValues(values, { scale, locations: undefined });
  const merged = { ...values, ...patch };
  const base = toInput(merged) as LocationInput;
  const label =
    trim(merged.labelShort) || trim(merged.labelNumber)
      ? {
          short: trim(merged.labelShort) || undefined,
          number: trim(merged.labelNumber) || undefined,
        }
      : undefined;
  const buildingProfile = buildingProfileFromFormValues(merged);

  if (scale === 'world') {
    return {
      ...base,
      category: undefined,
      parentId: undefined,
      label,
      buildingProfile: undefined,
    };
  }
  if (scale !== 'building') {
    return {
      ...base,
      label,
      buildingProfile: undefined,
    };
  }
  return {
    ...base,
    label,
    buildingProfile,
  };
};
