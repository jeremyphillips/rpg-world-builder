import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LocationMapPaintState } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';
import { resolveActiveRegionEntry } from '@/features/content/locations/domain/mapEditor/locationMapPaintSelection.helpers';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import { LocationMapRegionMetadataForm } from '@/features/content/locations/components/workspace/LocationMapRegionMetadataForm';
import type { RegionMetadataFormValues } from '@/features/content/locations/components/workspace/LocationMapRegionMetadataForm';

type LocationMapEditorPaintMapPanelProps = {
  paint: LocationMapPaintState;
  regionEntries: readonly LocationMapRegionAuthoringEntry[];
  onUpdateRegionEntry: (
    regionId: string,
    patch: Pick<LocationMapRegionAuthoringEntry, 'name' | 'description' | 'colorKey'>,
  ) => void;
  onFocusRegionInSelection?: () => void;
};

export function LocationMapEditorPaintMapPanel({
  paint,
  regionEntries,
  onUpdateRegionEntry,
  onFocusRegionInSelection,
}: LocationMapEditorPaintMapPanelProps) {
  if (paint.domain === 'surface') {
    return (
      <Typography variant="body2" color="text.secondary">
        Paint domain: Surface. Use the tray to pick terrain, then drag across cells to paint fills.
      </Typography>
    );
  }

  const active = resolveActiveRegionEntry(regionEntries, paint.activeRegionId);

  if (!active) {
    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          Region paint
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a region or choose one in the paint tray, then paint cells to assign them to that region.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" fontWeight={600}>
        Active region
      </Typography>
      {onFocusRegionInSelection ? (
        <Button variant="outlined" size="small" onClick={onFocusRegionInSelection} sx={{ alignSelf: 'flex-start' }}>
          Open in Selection
        </Button>
      ) : null}
      <LocationMapRegionMetadataForm
        region={active}
        formId="location-map-region-metadata-paint"
        onSubmitValues={(values: RegionMetadataFormValues) => {
          onUpdateRegionEntry(active.id, {
            name: values.name,
            description: values.description.trim() === '' ? undefined : values.description.trim(),
            colorKey: values.colorKey,
          });
        }}
      />
    </Stack>
  );
}
