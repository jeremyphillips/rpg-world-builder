import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { LOCATION_MAP_DEFAULT_REGION_NAME } from '@/shared/domain/locations/map/locationMapRegion.constants';
import { LOCATION_MAP_REGION_COLOR_KEYS } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import AppForm from '@/ui/patterns/form/AppForm';
import FormSelectField from '@/ui/patterns/form/FormSelectField';
import FormTextField from '@/ui/patterns/form/FormTextField';

export type RegionMetadataFormValues = {
  name: string;
  description: string;
  colorKey: LocationMapRegionColorKey;
};

type LocationMapRegionMetadataFormProps = {
  region: LocationMapRegionAuthoringEntry;
  onSubmitValues: (values: RegionMetadataFormValues) => void;
  formId?: string;
  submitLabel?: string;
};

const colorOptions = LOCATION_MAP_REGION_COLOR_KEYS.map((k) => ({ value: k, label: k }));

/**
 * Shared name / description / colorKey editor for authored map regions (Map rail + Selection).
 */
export function LocationMapRegionMetadataForm({
  region,
  onSubmitValues,
  formId,
  submitLabel = 'Save',
}: LocationMapRegionMetadataFormProps) {
  return (
    <AppForm<RegionMetadataFormValues>
      key={region.id}
      id={formId}
      defaultValues={{
        name: region.name,
        description: region.description ?? '',
        colorKey: region.colorKey,
      }}
      onSubmit={(data) => {
        onSubmitValues({
          name: data.name.trim() || LOCATION_MAP_DEFAULT_REGION_NAME,
          description: data.description.trim() === '' ? '' : data.description.trim(),
          colorKey: data.colorKey,
        });
      }}
    >
      <FormTextField name="name" label="Name" required />
      <FormTextField name="description" label="Description" multiline rows={3} />
      <FormSelectField name="colorKey" label="Color" options={colorOptions} required />
      <Stack direction="row" justifyContent="flex-end">
        <Button type="submit" variant="contained" size="small">
          {submitLabel}
        </Button>
      </Stack>
    </AppForm>
  );
}
