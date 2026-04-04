import { useEffect, useRef } from 'react';
import { FormProvider, useForm, useWatch, type UseFormReset } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { LOCATION_MAP_REGION_COLOR_KEYS } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import FormSelectField from '@/ui/patterns/form/FormSelectField';
import FormTextField from '@/ui/patterns/form/FormTextField';

import {
  normalizeRegionDescriptionForDraft,
  normalizeRegionNameForDraft,
  regionMetadataToFormValues,
  type RegionMetadataFormValues,
  type RegionMetadataPersistablePatch,
} from './regionMetadataDraftAdapter';

export type { RegionMetadataFormValues };

const DESCRIPTION_SYNC_DEBOUNCE_MS = 300;

const colorOptions = LOCATION_MAP_REGION_COLOR_KEYS.map((k) => ({ value: k, label: k }));

type LocationMapRegionMetadataFormProps = {
  region: LocationMapRegionAuthoringEntry;
  /** Writes persistable fields into workspace `gridDraft.regionEntries` as the user edits. */
  onPatchRegion: (patch: RegionMetadataPersistablePatch) => void;
  formId?: string;
  /** When true (default), explains that edits apply to the workspace map draft and header Save persists. */
  showPersistHint?: boolean;
};

/**
 * Name / description / colorKey for authored map regions. Persistable fields sync into workspace
 * `gridDraft` as the user edits; header Save persists the location and map.
 */
export function LocationMapRegionMetadataForm({
  region,
  onPatchRegion,
  formId,
  showPersistHint = true,
}: LocationMapRegionMetadataFormProps) {
  const patchRef = useRef(onPatchRegion);
  patchRef.current = onPatchRegion;

  const methods = useForm<RegionMetadataFormValues>({
    defaultValues: regionMetadataToFormValues(region),
  });
  const { control, reset } = methods;

  const resetRef = useRef<UseFormReset<RegionMetadataFormValues>>(reset);
  resetRef.current = reset;

  useEffect(() => {
    resetRef.current(regionMetadataToFormValues(region));
    // Only when switching regions — do not depend on `region` fields or we reset after every draft patch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- region.id only
  }, [region.id]);

  const description = useWatch({ control, name: 'description' });

  useEffect(() => {
    const t = window.setTimeout(() => {
      patchRef.current({
        description: normalizeRegionDescriptionForDraft(
          description === undefined || description === null ? '' : String(description),
        ),
      });
    }, DESCRIPTION_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [description, region.id]);

  const patchName = (raw: string) => {
    patchRef.current({ name: normalizeRegionNameForDraft(raw) });
  };

  const patchColor = (raw: string) => {
    patchRef.current({ colorKey: raw as LocationMapRegionColorKey });
  };

  return (
    <FormProvider {...methods}>
      <Box id={formId} component="div">
        <Stack spacing={2}>
          {showPersistHint ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Changes apply to the map draft as you edit. Use <strong>Save</strong> in the header to persist the
              location and map to the campaign.
            </Typography>
          ) : null}
          <FormTextField
            name="name"
            label="Name"
            required
            size="small"
            onAfterChange={patchName}
          />
          <FormTextField
            name="description"
            label="Description"
            multiline
            rows={3}
            size="small"
          />
          <FormSelectField
            name="colorKey"
            label="Color"
            options={colorOptions}
            required
            size="small"
            onAfterChange={patchColor}
          />
        </Stack>
      </Box>
    </FormProvider>
  );
}
