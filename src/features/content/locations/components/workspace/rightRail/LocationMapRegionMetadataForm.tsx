import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { FormProvider, useForm, useWatch, type UseFormReset } from 'react-hook-form';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useDebouncedPersistableField } from '@/ui/hooks';

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
  /**
   * Writes persistable fields into workspace `gridDraft.regionEntries` as the user edits.
   * First argument is the region id (explicit so flush-on-boundary can target the correct region).
   */
  onPatchRegion: (regionId: string, patch: RegionMetadataPersistablePatch) => void;
  formId?: string;
  /** When true (default), explains that edits apply to the workspace map draft and header Save persists. */
  showPersistHint?: boolean;
  /**
   * When set, the form registers `flush` here so the route can run it before header Save / other boundaries.
   */
  debouncedPersistableFlushRef?: MutableRefObject<(() => void) | null>;
};

/**
 * Name / description / colorKey for authored map regions. Persistable fields sync into workspace
 * `gridDraft` as the user edits; header Save persists the location and map.
 *
 * Description uses debounced sync plus **flush** on region change, tab/selection unmount, and via
 * `debouncedPersistableFlushRef` before Save.
 */
export function LocationMapRegionMetadataForm({
  region,
  onPatchRegion,
  formId,
  showPersistHint = true,
  debouncedPersistableFlushRef,
}: LocationMapRegionMetadataFormProps) {
  const patchRef = useRef(onPatchRegion);
  patchRef.current = onPatchRegion;

  const methods = useForm<RegionMetadataFormValues>({
    defaultValues: regionMetadataToFormValues(region),
  });
  const { control, reset, getValues } = methods;

  const resetRef = useRef<UseFormReset<RegionMetadataFormValues>>(reset);
  resetRef.current = reset;

  const prevRegionIdRef = useRef(region.id);

  const description = useWatch({ control, name: 'description' });

  const { flush } = useDebouncedPersistableField({
    value: description,
    delayMs: DESCRIPTION_SYNC_DEBOUNCE_MS,
    onCommit: (v) => {
      patchRef.current(region.id, {
        description: normalizeRegionDescriptionForDraft(
          v === undefined || v === null ? '' : String(v),
        ),
      });
    },
  });

  useLayoutEffect(() => {
    if (prevRegionIdRef.current !== region.id) {
      const prevId = prevRegionIdRef.current;
      const desc = getValues('description');
      patchRef.current(prevId, {
        description: normalizeRegionDescriptionForDraft(
          desc === undefined || desc === null ? '' : String(desc),
        ),
      });
      prevRegionIdRef.current = region.id;
    }
    resetRef.current(regionMetadataToFormValues(region));
    // Only when `region.id` changes — do not depend on `region` fields or we reset after every draft patch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [region.id]);

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  useEffect(() => {
    if (!debouncedPersistableFlushRef) return;
    debouncedPersistableFlushRef.current = flush;
    return () => {
      if (debouncedPersistableFlushRef.current === flush) {
        debouncedPersistableFlushRef.current = null;
      }
    };
  }, [debouncedPersistableFlushRef, flush]);

  const patchName = (raw: string) => {
    patchRef.current(region.id, { name: normalizeRegionNameForDraft(raw) });
  };

  const patchColor = (raw: string) => {
    patchRef.current(region.id, { colorKey: raw as LocationMapRegionColorKey });
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
