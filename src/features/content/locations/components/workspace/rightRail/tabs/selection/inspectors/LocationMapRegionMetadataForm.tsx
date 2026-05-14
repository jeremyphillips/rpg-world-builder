import { useEffect, useLayoutEffect, useRef, type MutableRefObject } from 'react';
import { FormProvider, useForm, useWatch, type UseFormReset } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useDebouncedPersistableField } from '@/ui/hooks';

import {
  getLocationMapRegionColorDisplayName,
  LOCATION_MAP_REGION_COLOR_KEYS,
} from '@/features/content/locations/domain/model/map/locationMapRegionColors.types';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/model/map/locationMapRegionColors.types';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import AppFormSelect from '@/ui/patterns/form/AppFormSelect';

import {
  normalizeRegionDescriptionForDraft,
  normalizeRegionNameForDraft,
  regionMetadataToFormValues,
  type RegionMetadataFormValues,
  type RegionMetadataPersistablePatch,
} from '../../../adapters';

import { RailNameDescriptionFormFields } from '../fields/railNameDescriptionFields';
import { SelectionRailIdentityBlock } from '../templates/SelectionRailTemplate';

export type { RegionMetadataFormValues };

const DESCRIPTION_SYNC_DEBOUNCE_MS = 300;

const colorOptions = LOCATION_MAP_REGION_COLOR_KEYS.map((k) => ({
  value: k,
  label: getLocationMapRegionColorDisplayName(k),
}));

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
  /** Clears region from the map draft (entry + cell paint); same semantics as Selection Delete. */
  onRemoveFromMap?: () => void;
  /** Enter region paint for this region (spatial edit); metadata stays in Selection. */
  onEditRegionSpatially?: () => void;
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
  onRemoveFromMap,
  onEditRegionSpatially,
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
  const nameWatch = useWatch({ control, name: 'name' });

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

  const displayTitle =
    typeof nameWatch === 'string'
      ? nameWatch.trim() || 'Region'
      : region.name?.trim()
        ? region.name.trim()
        : 'Region';

  return (
    <FormProvider {...methods}>
      <Box id={formId} component="div">
        <Stack spacing={2}>
          <SelectionRailIdentityBlock
            categoryLabel="Map"
            title={displayTitle}
            placementLine="Overlay region"
          />
          {showPersistHint ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Changes apply to the map draft as you edit. Use <strong>Save</strong> in the header to persist the
              location and map to the campaign.
            </Typography>
          ) : null}
          <RailNameDescriptionFormFields nameRequired onNameAfterChange={patchName} />
          <AppFormSelect
            name="colorKey"
            label="Color"
            options={colorOptions}
            required
            size="small"
            onAfterChange={patchColor}
          />
          {onEditRegionSpatially ? (
            <Button variant="outlined" size="small" onClick={onEditRegionSpatially} sx={{ alignSelf: 'flex-start' }}>
              Edit region
            </Button>
          ) : null}
          {onRemoveFromMap ? (
            <>
              <Divider />
              <Button size="small" color="error" variant="outlined" onClick={onRemoveFromMap}>
                Remove from map
              </Button>
            </>
          ) : null}
        </Stack>
      </Box>
    </FormProvider>
  );
}
