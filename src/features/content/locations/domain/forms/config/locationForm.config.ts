/**
 * Location form configs for ConditionalFormRenderer.
 */
import type { FieldConfig } from '@/ui/patterns';
import type { PickerOption } from '@/ui/patterns/form/OptionPickerField';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import {
  LOCATION_FORM_FIELDS,
  LOCATION_GRID_BOOTSTRAP_FIELD_NAMES,
} from '../registry/locationForm.registry';
import type { LocationFormValues } from '../types/locationForm.types';
import type { LocationFormUiPolicy } from '../utils/locationFormUiRules';

export type GetLocationFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
  /** Populated client-side for the parent location option picker */
  parentLocationOptions?: PickerOption[];
  /** Cell units allowed for the current location scale (maps to map kind). */
  gridCellUnitOptions?: { value: string; label: string }[];
  /** When false, omits optional default-map grid bootstrap fields (system patch flow). */
  includeGridBootstrap?: boolean;
  /**
   * Scale/category/parent visibility and scale disabled state — from shared UI helpers.
   * When omitted, all scales and fields are available (legacy / patch flows).
   */
  locationUiPolicy?: LocationFormUiPolicy;
};

export const getLocationFieldConfigs = (
  options: GetLocationFieldConfigsOptions = {},
): FieldConfig[] => {
  const {
    policyCharacters,
    parentLocationOptions,
    gridCellUnitOptions,
    includeGridBootstrap = true,
    locationUiPolicy,
  } = options;

  let specs =
    includeGridBootstrap === false
      ? LOCATION_FORM_FIELDS.filter((f) => !LOCATION_GRID_BOOTSTRAP_FIELD_NAMES.has(f.name))
      : [...LOCATION_FORM_FIELDS];

  if (locationUiPolicy) {
    if (!locationUiPolicy.showCategoryField) {
      specs = specs.filter((f) => f.name !== 'category');
    }
    if (!locationUiPolicy.showParentField) {
      specs = specs.filter((f) => f.name !== 'parentId');
    }
    if (locationUiPolicy.showGridCellUnitField === false) {
      specs = specs.filter((f) => f.name !== 'gridCellUnit');
    }
  }

  const configs = buildFieldConfigs(specs, {
    policyCharacters,
    optionPickerOptionsByField: {
      parentId: parentLocationOptions ?? [],
    },
  });

  return configs.map((f) => {
    if (f.name === 'category' && f.type === 'select' && locationUiPolicy) {
      return {
        ...f,
        options: locationUiPolicy.categorySelectOptions,
        disabled: locationUiPolicy.categoryFieldDisabled,
      };
    }
    if (f.name === 'gridCellUnit' && f.type === 'select') {
      return {
        ...f,
        options:
          gridCellUnitOptions && gridCellUnitOptions.length > 0
            ? gridCellUnitOptions
            : f.options,
        ...(locationUiPolicy ? { disabled: locationUiPolicy.gridCellUnitFieldDisabled } : {}),
      };
    }
    if (f.name === 'scale' && f.type === 'select' && locationUiPolicy) {
      return {
        ...f,
        options: locationUiPolicy.scaleSelectOptions,
        disabled: locationUiPolicy.scaleFieldDisabled,
      };
    }
    return f;
  });
};

export const LOCATION_FORM_DEFAULTS: LocationFormValues = buildDefaultValues<LocationFormValues>(
  getLocationFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
