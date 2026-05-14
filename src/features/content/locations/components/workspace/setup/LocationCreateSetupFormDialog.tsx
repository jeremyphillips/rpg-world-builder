import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { UseFormReturn } from 'react-hook-form';

import type { Location } from '@/features/content/locations/domain/model/location';
import {
  buildParentLocationPickerOptions,
  getAllowedLocationScaleOptionsForCreate,
  getFilteredParentLocationsForChildScale,
  shouldShowCategoryChoiceInLocationSetup,
  shouldShowCellUnitChoiceInLocationSetup,
  shouldShowParentFieldForScale,
} from '@/features/content/locations/domain';
import { getAllowedLocationBuildingPrimarySubtypesForType } from '@/features/content/locations/domain/model/building/locationBuilding.policy';
import {
  LOCATION_BUILDING_FUNCTION_META,
  LOCATION_BUILDING_PRIMARY_SUBTYPE_META,
  LOCATION_BUILDING_PRIMARY_TYPE_META,
} from '@/features/content/locations/domain/model/building/locationBuilding.meta';
import type { LocationCreateSetupDraft } from '@/features/content/locations/domain/forms/setup/locationCreateSetupForm';
import {
  getAllowedCategoryOptionsForScale,
  getAllowedCellUnitOptionsForScale,
  getDefaultCellUnitForScalePolicy,
  LOCATION_BUILDING_FUNCTION_IDS,
  LOCATION_BUILDING_FORM_CLASS_IDS,
  LOCATION_BUILDING_FORM_DEFAULT_GRID_SIZES,
  LOCATION_BUILDING_PRIMARY_TYPE_IDS,
  normalizeCategoryForScale,
  normalizeGridCellUnitForScale,
  type LocationBuildingFormClassId,
} from '@/shared/domain/locations';
import type { GridSizePreset } from '@/shared/domain/grid/gridPresets';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import { AppModal } from '@/ui/patterns';
import { AppForm, AppFormCheckbox, AppFormTextField, AppFormSelect } from '@/ui/patterns/form';
import FormOptionPickerField from '@/ui/patterns/form/FormOptionPickerField';

const FORM_ID = 'location-create-setup-form';

const PRESET_MENU: { value: GridSizePreset; label: string }[] = (
  Object.entries(GRID_SIZE_PRESETS) as [
    GridSizePreset,
    (typeof GRID_SIZE_PRESETS)[GridSizePreset],
  ][]
).map(([key, v]) => ({
  value: key,
  label: `${key} (${v.columns}×${v.rows})`,
}));

const BUILDING_TYPE_OPTIONS = LOCATION_BUILDING_PRIMARY_TYPE_IDS.map((id) => ({
  value: id,
  label: LOCATION_BUILDING_PRIMARY_TYPE_META[id].label,
}));

const BUILDING_FUNCTION_OPTIONS = LOCATION_BUILDING_FUNCTION_IDS.map((id) => ({
  value: id,
  label: LOCATION_BUILDING_FUNCTION_META[id].label,
}));

const BUILDING_FORM_CLASS_MENU: {
  value: LocationBuildingFormClassId;
  label: string;
}[] = LOCATION_BUILDING_FORM_CLASS_IDS.map((id) => {
  const g = LOCATION_BUILDING_FORM_DEFAULT_GRID_SIZES[id];
  const labelById: Record<LocationBuildingFormClassId, string> = {
    compact_small: 'Compact — small (20′×20′ interior @ 5′ cells)',
    compact_medium: 'Compact — medium (30′×30′ @ 5′ cells)',
    wide_medium: 'Wide — medium (40′×30′ @ 5′ cells)',
    wide_large: 'Wide — large (50′×40′ @ 5′ cells)',
  };
  return {
    value: id,
    label: `${labelById[id]} (${g.columns}×${g.rows} cells)`,
  };
});

function emptyDraft(): LocationCreateSetupDraft {
  return {
    name: '',
    scale: '',
    parentId: '',
    category: '',
    gridCellUnit: '',
    gridPresetKey: 'medium',
    buildingPrimaryType: '',
    buildingPrimarySubtype: '',
    buildingFunctions: [],
    buildingIsPublicStorefront: false,
    buildingFormClassId: 'compact_medium',
  };
}

function draftAfterScaleChange(
  prev: LocationCreateSetupDraft,
  nextScale: string,
): LocationCreateSetupDraft {
  const cats = getAllowedCategoryOptionsForScale(nextScale);
  const category = cats.length === 1 ? cats[0].value : '';

  const units = getAllowedCellUnitOptionsForScale(nextScale);
  let gridCellUnit = prev.gridCellUnit;
  if (units.length === 1) {
    gridCellUnit = units[0].value;
  } else if (units.length > 1) {
    gridCellUnit = normalizeGridCellUnitForScale(prev.gridCellUnit, nextScale);
  } else {
    gridCellUnit = getDefaultCellUnitForScalePolicy(nextScale);
  }

  const base: LocationCreateSetupDraft = {
    ...prev,
    scale: nextScale,
    parentId: '',
    category,
    gridCellUnit,
  };

  if (nextScale !== 'building') {
    return {
      ...base,
      buildingPrimaryType: '',
      buildingPrimarySubtype: '',
      buildingFunctions: [],
      buildingIsPublicStorefront: false,
      buildingFormClassId: undefined,
    };
  }

  return {
    ...base,
    buildingFormClassId: prev.buildingFormClassId ?? 'compact_medium',
    buildingFunctions: prev.buildingFunctions ?? [],
  };
}

export type LocationCreateSetupFormDialogProps = {
  open: boolean;
  campaignHasWorldLocation: boolean;
  locationsLoading: boolean;
  locations: Location[];
  saving?: boolean;
  submitError?: string | null;
  onCancel: () => void;
  onComplete: (draft: LocationCreateSetupDraft) => void | Promise<void>;
};

type SetupFormFieldsProps = {
  methods: UseFormReturn<LocationCreateSetupDraft>;
  open: boolean;
  campaignHasWorldLocation: boolean;
  locationsLoading: boolean;
  locations: Location[];
  scaleOptions: { value: string; label: string }[];
  formDisabled: boolean;
};

function LocationCreateSetupFormFields({
  methods,
  open,
  campaignHasWorldLocation,
  locationsLoading,
  locations,
  scaleOptions,
  formDisabled,
}: SetupFormFieldsProps) {
  const { reset, setValue, getValues, watch } = methods;
  const scale = watch('scale');
  const buildingPrimaryType = watch('buildingPrimaryType');

  const buildingSubtypeOptions = useMemo(() => {
    if (!buildingPrimaryType) return [];
    return getAllowedLocationBuildingPrimarySubtypesForType(buildingPrimaryType).map((id) => ({
      value: id,
      label: LOCATION_BUILDING_PRIMARY_SUBTYPE_META[id].label,
    }));
  }, [buildingPrimaryType]);

  useEffect(() => {
    if (!open) {
      reset(emptyDraft());
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || locationsLoading) return;
    if (locations.length === 0 && !campaignHasWorldLocation) {
      const s = getValues('scale');
      if (!s) setValue('scale', 'world', { shouldDirty: false });
    }
  }, [
    open,
    locationsLoading,
    locations.length,
    campaignHasWorldLocation,
    getValues,
    setValue,
  ]);

  const parentOptions = useMemo(() => {
    if (!scale) return [];
    const filtered = getFilteredParentLocationsForChildScale(
      locations,
      scale,
      undefined,
    );
    return buildParentLocationPickerOptions(filtered, {});
  }, [locations, scale]);

  const parentSelectOptions = useMemo(
    () => parentOptions.map((o) => ({ value: o.value, label: o.label })),
    [parentOptions],
  );

  const showParent = shouldShowParentFieldForScale(scale);
  const showCategory = shouldShowCategoryChoiceInLocationSetup(scale);
  const showCellUnit = shouldShowCellUnitChoiceInLocationSetup(scale);

  const handleScaleAfterChange = useCallback(
    (nextScale: string) => {
      const prev = getValues();
      const next = draftAfterScaleChange(prev, nextScale);
      setValue('parentId', next.parentId, { shouldDirty: true });
      setValue('category', next.category, { shouldDirty: true });
      setValue('gridCellUnit', next.gridCellUnit, { shouldDirty: true });
      setValue('buildingPrimaryType', next.buildingPrimaryType ?? '', { shouldDirty: true });
      setValue('buildingPrimarySubtype', next.buildingPrimarySubtype ?? '', { shouldDirty: true });
      setValue('buildingFunctions', next.buildingFunctions ?? [], { shouldDirty: true });
      setValue('buildingIsPublicStorefront', next.buildingIsPublicStorefront ?? false, {
        shouldDirty: true,
      });
      setValue('buildingFormClassId', next.buildingFormClassId ?? 'compact_medium', {
        shouldDirty: true,
      });
    },
    [getValues, setValue],
  );

  return (
    <>
      <AppFormTextField name="name" label="Name" required disabled={formDisabled} />

      <AppFormSelect
        name="scale"
        label="Scale"
        placeholder="Select scale"
        options={scaleOptions}
        required
        disabled={formDisabled || locationsLoading}
        onAfterChange={handleScaleAfterChange}
      />

      {showParent && (
        <AppFormSelect
          name="parentId"
          label="Parent location"
          options={parentSelectOptions}
          disabled={formDisabled || !scale || locationsLoading}
          placeholder="None"
        />
      )}

      {showCategory && scale && (
        <AppFormSelect
          name="category"
          label="Category"
          options={getAllowedCategoryOptionsForScale(scale)}
          required
          disabled={formDisabled}
        />
      )}

      {showCellUnit && scale && (
        <AppFormSelect
          name="gridCellUnit"
          label="Cell unit"
          options={getAllowedCellUnitOptionsForScale(scale)}
          required
          disabled={formDisabled}
        />
      )}

      {scale === 'building' ? (
        <>
          <AppFormSelect
            name="buildingPrimaryType"
            label="Building type"
            options={BUILDING_TYPE_OPTIONS}
            placeholder="Select type"
            required
            disabled={formDisabled}
          />
          {buildingPrimaryType ? (
            <AppFormSelect
              name="buildingPrimarySubtype"
              label="Building subtype"
              options={buildingSubtypeOptions}
              placeholder="Optional"
              disabled={formDisabled || buildingSubtypeOptions.length === 0}
            />
          ) : null}
          <FormOptionPickerField
            name="buildingFunctions"
            label="Additional functions"
            options={BUILDING_FUNCTION_OPTIONS}
            valueMode="array"
            renderSelectedAs="chip"
            placeholder="Add functions…"
            disabled={formDisabled}
            helperText="Optional. Mixed-use roles such as trade, lodging, or worship."
          />
          <AppFormCheckbox
            name="buildingIsPublicStorefront"
            label="Open to the public"
            disabled={formDisabled}
            helperText="Shops, temples, guild halls, inns, and similar when visitors are welcome."
          />
          <AppFormSelect
            name="buildingFormClassId"
            label="Building form"
            options={BUILDING_FORM_CLASS_MENU}
            required
            disabled={formDisabled}
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Structural footprint class for the first interior map (5′ cells). Semantic type and functions are
            above; city-map building marker footprint is chosen when you place the marker.
          </Typography>
        </>
      ) : null}

      {scale && scale !== 'building' ? (
        <AppFormSelect
          name="gridPresetKey"
          label="Grid size"
          options={PRESET_MENU}
          required
          disabled={formDisabled}
        />
      ) : null}

      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          Map geometry follows scale policy (no separate choice in this step).
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
          Continue creates the location and opens the map editor on the next screen.
        </Typography>
      </Box>
    </>
  );
}

export function LocationCreateSetupFormDialog({
  open,
  campaignHasWorldLocation,
  locationsLoading,
  locations,
  saving = false,
  submitError,
  onCancel,
  onComplete,
}: LocationCreateSetupFormDialogProps) {
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  const scaleOptions = useMemo(
    () => getAllowedLocationScaleOptionsForCreate(campaignHasWorldLocation),
    [campaignHasWorldLocation],
  );

  const formDisabled = locationsLoading || saving;

  const footerNote = locationsLoading
    ? 'Loading campaign locations…'
    : saving
      ? 'Creating your location and default map. This may take a moment.'
      : 'Continue saves the location and opens the map editor on the next screen.';

  const handleFormSubmit = useCallback(
    async (data: LocationCreateSetupDraft) => {
      setLocalValidationError(null);
      if (data.scale === 'building') {
        if (!data.buildingPrimaryType?.trim()) {
          setLocalValidationError('Please select a building type.');
          return;
        }
        if (!data.buildingFormClassId) {
          setLocalValidationError('Please select a building form.');
          return;
        }
      }
      const normalized: LocationCreateSetupDraft = {
        ...data,
        name: data.name.trim(),
        category: normalizeCategoryForScale(data.category, data.scale),
        gridCellUnit: normalizeGridCellUnitForScale(data.gridCellUnit, data.scale),
        parentId: data.parentId.trim(),
        buildingPrimaryType: data.buildingPrimaryType?.trim(),
        buildingPrimarySubtype: data.buildingPrimarySubtype?.trim(),
        buildingFunctions: data.buildingFunctions ?? [],
      };
      await onComplete(normalized);
    },
    [onComplete],
  );

  const combinedError = submitError ?? localValidationError;

  const requestSubmit = useCallback(() => {
    (document.getElementById(FORM_ID) as HTMLFormElement)?.requestSubmit();
  }, []);

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      headline="Set up location"
      subheadline="Choose name, scale, optional parent, and grid or building details. Continue creates the location and takes you to the editor."
      description={
        locationsLoading
          ? undefined
          : 'Finish this step first. The map editor opens after your location and default map are saved.'
      }
      closeOnBackdropClick={false}
      closeOnEsc={false}
      showCloseButton={false}
      loading={locationsLoading}
      size="standard"
      footerNote={footerNote}
      alert={
        combinedError
          ? { severity: 'error', message: combinedError }
          : undefined
      }
      secondaryAction={{
        label: 'Back',
        onClick: onCancel,
        variant: 'outlined',
        disabled: locationsLoading || saving,
      }}
      primaryAction={{
        label: saving ? 'Saving…' : 'Continue',
        onClick: requestSubmit,
        disabled: formDisabled,
        loading: saving,
      }}
    >
      <AppForm<LocationCreateSetupDraft>
        id={FORM_ID}
        defaultValues={emptyDraft()}
        onSubmit={handleFormSubmit}
        spacing={2.5}
      >
        {(methods) => (
          <LocationCreateSetupFormFields
            methods={methods}
            open={open}
            campaignHasWorldLocation={campaignHasWorldLocation}
            locationsLoading={locationsLoading}
            locations={locations}
            scaleOptions={scaleOptions}
            formDisabled={formDisabled}
          />
        )}
      </AppForm>
    </AppModal>
  );
}
