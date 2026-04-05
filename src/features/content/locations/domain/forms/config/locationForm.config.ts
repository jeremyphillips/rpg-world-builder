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
import {
  type LocationFormUiPolicy,
  shouldShowCategoryEditableInCreateRail,
} from '../rules/locationFormUiRules';

export type GetLocationFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
  /** Populated client-side for the parent location option picker */
  parentLocationOptions?: PickerOption[];
  /**
   * Building Subtype options for the selected Building Type (from
   * `buildBuildingSubtypeSelectOptions(watch('buildingPrimaryType'))`).
   */
  buildingSubtypeSelectOptions?: { value: string; label: string }[];
  /** PC + NPC picker options for building Owners / Staff (same list for both fields). */
  buildingProfileEntityPickerOptions?: PickerOption[];
  /** Cell units allowed for the current location scale (maps to map kind). */
  gridCellUnitOptions?: { value: string; label: string }[];
  /** When false, omits optional default-map grid bootstrap fields (system patch flow). */
  includeGridBootstrap?: boolean;
  /**
   * Scale/category/parent visibility and scale disabled state — from shared UI helpers.
   * When omitted, all scales and fields are available (legacy / patch flows).
   */
  locationUiPolicy?: LocationFormUiPolicy;
  /**
   * Location create route after setup: omit scale + grid bootstrap fields; category may be static in route.
   */
  createPostSetupRail?: boolean;
  /** Required with `createPostSetupRail` for category select vs static row. */
  scaleForRail?: string;
};

export const getLocationFieldConfigs = (
  options: GetLocationFieldConfigsOptions = {},
): FieldConfig[] => {
  const {
    policyCharacters,
    parentLocationOptions,
    buildingSubtypeSelectOptions,
    buildingProfileEntityPickerOptions,
    gridCellUnitOptions,
    includeGridBootstrap = true,
    locationUiPolicy,
    createPostSetupRail,
    scaleForRail,
  } = options;

  const CREATE_POST_SETUP_OMIT = new Set<string>([
    'scale',
    'gridPreset',
    'gridColumns',
    'gridRows',
    'gridCellUnit',
  ]);

  let specs =
    includeGridBootstrap === false
      ? LOCATION_FORM_FIELDS.filter((f) => !LOCATION_GRID_BOOTSTRAP_FIELD_NAMES.has(f.name))
      : [...LOCATION_FORM_FIELDS];

  if (createPostSetupRail) {
    specs = specs.filter((f) => !CREATE_POST_SETUP_OMIT.has(f.name));
    if (locationUiPolicy && scaleForRail) {
      if (
        locationUiPolicy.showCategoryField &&
        !shouldShowCategoryEditableInCreateRail(scaleForRail)
      ) {
        specs = specs.filter((f) => f.name !== 'category');
      }
    }
  }

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
      buildingOwnerRefs: buildingProfileEntityPickerOptions ?? [],
      buildingStaffRefs: buildingProfileEntityPickerOptions ?? [],
    },
  });

  const withPolicyOptions = configs.map((f) => {
    if (
      f.name === 'buildingPrimarySubtype' &&
      f.type === 'select' &&
      buildingSubtypeSelectOptions &&
      buildingSubtypeSelectOptions.length > 0
    ) {
      return {
        ...f,
        options: buildingSubtypeSelectOptions,
      };
    }
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
      };
    }
    return f;
  });

  return withPolicyOptions.map((f) => {
    /** Scale is always read-only key/value in metadata (same presentation as category with one option). */
    if (f.name === 'scale' && f.type === 'select') {
      const opts = f.options;
      return {
        type: 'staticLabelValue' as const,
        name: f.name,
        label: f.label,
        visibleWhen: f.visibleWhen,
        group: f.group,
        width: f.width,
        fieldDescription: f.fieldDescription,
        helperText: f.helperText,
        defaultValue: f.defaultValue,
        required: f.required,
        disabled: f.disabled,
        formatDisplay: (raw: string) => {
          const hit = opts.find((o) => o.value === raw);
          return hit?.label ?? (raw || '—');
        },
      };
    }
    /**
     * Map grid bootstrap fields are read-only in the metadata rail.
     *
     * @todo Support changing default map columns, rows, and cell unit for **published**
     *   locations (e.g. migration, versioning, or explicit “apply map shape” flow). Today,
     *   cell/grid edits on the canvas do not imply a persisted default-map shape change for
     *   the location record in all cases.
     */
    if (f.name === 'gridColumns' && f.type === 'text') {
      return {
        type: 'staticLabelValue' as const,
        name: f.name,
        label: f.label,
        visibleWhen: f.visibleWhen,
        group: f.group,
        width: f.width,
        fieldDescription: f.fieldDescription,
        helperText: f.helperText,
        defaultValue: f.defaultValue,
        required: f.required,
        disabled: f.disabled,
        formatDisplay: (raw: string) => (String(raw).trim() ? String(raw) : '—'),
      };
    }
    if (f.name === 'gridRows' && f.type === 'text') {
      return {
        type: 'staticLabelValue' as const,
        name: f.name,
        label: f.label,
        visibleWhen: f.visibleWhen,
        group: f.group,
        width: f.width,
        fieldDescription: f.fieldDescription,
        helperText: f.helperText,
        defaultValue: f.defaultValue,
        required: f.required,
        disabled: f.disabled,
        formatDisplay: (raw: string) => (String(raw).trim() ? String(raw) : '—'),
      };
    }
    if (f.name === 'gridCellUnit' && f.type === 'select') {
      const opts = f.options;
      return {
        type: 'staticLabelValue' as const,
        name: f.name,
        label: f.label,
        visibleWhen: f.visibleWhen,
        group: f.group,
        width: f.width,
        fieldDescription: f.fieldDescription,
        helperText: f.helperText,
        defaultValue: f.defaultValue,
        required: f.required,
        disabled: f.disabled,
        formatDisplay: (raw: string) => {
          const hit = opts.find((o) => o.value === raw);
          return hit?.label ?? (raw || '—');
        },
      };
    }
    if (!locationUiPolicy) return f;
    if (f.name === 'category' && f.type === 'select' && f.options.length <= 1) {
      const opts = f.options;
      return {
        type: 'staticLabelValue' as const,
        name: f.name,
        label: f.label,
        visibleWhen: f.visibleWhen,
        group: f.group,
        width: f.width,
        fieldDescription: f.fieldDescription,
        helperText: f.helperText,
        defaultValue: f.defaultValue,
        required: f.required,
        disabled: f.disabled,
        formatDisplay: (raw: string) => {
          const hit = opts.find((o) => o.value === raw);
          return hit?.label ?? (raw || '—');
        },
      };
    }
    return f;
  });
};

export const LOCATION_FORM_DEFAULTS: LocationFormValues = buildDefaultValues<LocationFormValues>(
  getLocationFieldConfigs(),
  {
    accessPolicy: DEFAULT_VISIBILITY_PUBLIC,
    imageKey: '',
    buildingPrimaryType: '',
    buildingPrimarySubtype: '',
    buildingFunctions: [],
    buildingIsPublicStorefront: false,
    buildingOwnerRefs: [],
    buildingStaffRefs: [],
  },
);
