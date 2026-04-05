import { useCallback, useEffect, useMemo } from 'react';
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
import type { LocationCreateSetupDraft } from '@/features/content/locations/domain/forms/setup/locationCreateSetupForm';
import {
  getAllowedCategoryOptionsForScale,
  getAllowedCellUnitOptionsForScale,
  getDefaultCellUnitForScalePolicy,
  normalizeCategoryForScale,
  normalizeGridCellUnitForScale,
} from '@/shared/domain/locations';
import type { GridSizePreset } from '@/shared/domain/grid/gridPresets';
import { GRID_SIZE_PRESETS } from '@/shared/domain/grid/gridPresets';
import { AppModal } from '@/ui/patterns';
import { AppForm, FormSelectField, FormTextField } from '@/ui/patterns/form';

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

function emptyDraft(): LocationCreateSetupDraft {
  return {
    name: '',
    scale: '',
    parentId: '',
    category: '',
    gridCellUnit: '',
    gridPresetKey: 'medium',
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

  return {
    ...prev,
    scale: nextScale,
    parentId: '',
    category,
    gridCellUnit,
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
    },
    [getValues, setValue],
  );

  return (
    <>
      <FormTextField name="name" label="Name" required disabled={formDisabled} />

      <FormSelectField
        name="scale"
        label="Scale"
        placeholder="Select scale"
        options={scaleOptions}
        required
        disabled={formDisabled || locationsLoading}
        onAfterChange={handleScaleAfterChange}
      />

      {showParent && (
        <FormSelectField
          name="parentId"
          label="Parent location"
          options={parentSelectOptions}
          disabled={formDisabled || !scale || locationsLoading}
          placeholder="None"
        />
      )}

      {showCategory && scale && (
        <FormSelectField
          name="category"
          label="Category"
          options={getAllowedCategoryOptionsForScale(scale)}
          required
          disabled={formDisabled}
        />
      )}

      {showCellUnit && scale && (
        <FormSelectField
          name="gridCellUnit"
          label="Cell unit"
          options={getAllowedCellUnitOptionsForScale(scale)}
          required
          disabled={formDisabled}
        />
      )}

      <FormSelectField
        name="gridPresetKey"
        label="Grid size"
        options={PRESET_MENU}
        required
        disabled={formDisabled}
      />

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
      const normalized: LocationCreateSetupDraft = {
        ...data,
        name: data.name.trim(),
        category: normalizeCategoryForScale(data.category, data.scale),
        gridCellUnit: normalizeGridCellUnitForScale(data.gridCellUnit, data.scale),
        parentId: data.parentId.trim(),
      };
      await onComplete(normalized);
    },
    [onComplete],
  );

  const requestSubmit = useCallback(() => {
    (document.getElementById(FORM_ID) as HTMLFormElement)?.requestSubmit();
  }, []);

  return (
    <AppModal
      open={open}
      onClose={onCancel}
      headline="Set up location"
      subheadline="Choose the initial name, scale, optional parent, and grid size. Continue creates the location and takes you to the editor."
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
        submitError
          ? { severity: 'error', message: submitError }
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
