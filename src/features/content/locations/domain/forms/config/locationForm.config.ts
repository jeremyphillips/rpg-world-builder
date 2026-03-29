/**
 * Location form configs for ConditionalFormRenderer.
 */
import type { FieldConfig } from '@/ui/patterns';
import type { PickerOption } from '@/ui/patterns/form/OptionPickerField';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import { LOCATION_FORM_FIELDS } from '../registry/locationForm.registry';
import type { LocationFormValues } from '../types/locationForm.types';

export type GetLocationFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
  /** Populated client-side for the parent location option picker */
  parentLocationOptions?: PickerOption[];
};

export const getLocationFieldConfigs = (
  options: GetLocationFieldConfigsOptions = {},
): FieldConfig[] =>
  buildFieldConfigs(LOCATION_FORM_FIELDS, {
    policyCharacters: options.policyCharacters,
    optionPickerOptionsByField: {
      parentId: options.parentLocationOptions ?? [],
    },
  });

export const LOCATION_FORM_DEFAULTS: LocationFormValues = buildDefaultValues<LocationFormValues>(
  getLocationFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
