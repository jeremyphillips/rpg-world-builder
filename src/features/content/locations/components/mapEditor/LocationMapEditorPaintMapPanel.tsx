import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getMapRegionColor } from '@/app/theme/mapColors';
import { LOCATION_MAP_REGION_COLOR_KEYS } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/mapContent/locationMapRegionColors.types';
import { resolveActiveRegionEntry, type LocationMapPaintState } from '@/features/content/locations/domain/mapEditor';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';

import { RegionPaintActiveRegionSelect } from '@/features/content/locations/components/workspace/leftTools';

type LocationMapEditorPaintMapPanelProps = {
  paint: LocationMapPaintState;
  regionEntries: readonly LocationMapRegionAuthoringEntry[];
  onCreateRegion: () => void;
  onSelectActiveRegion: (regionId: string) => void;
  onActiveRegionColorKeyChange: (colorKey: LocationMapRegionColorKey) => void;
  onEditRegionInSelection: () => void;
};

export function LocationMapEditorPaintMapPanel({
  paint,
  regionEntries,
  onCreateRegion,
  onSelectActiveRegion,
  onActiveRegionColorKeyChange,
  onEditRegionInSelection,
}: LocationMapEditorPaintMapPanelProps) {
  if (paint.domain === 'surface') {
    return (
      <Typography variant="body2" color="text.secondary">
        Paint domain: Surface. Use the tray to pick terrain, then drag across cells to paint fills.
      </Typography>
    );
  }

  const active = resolveActiveRegionEntry(regionEntries, paint.activeRegionId);
  const regionColorKey = active?.colorKey ?? LOCATION_MAP_REGION_COLOR_KEYS[0];
  const regionSwatchColor = getMapRegionColor(regionColorKey);

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600}>
        Region paint
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Paint cells into the active region. Full name, description, and color editing are in Selection.
      </Typography>

      <Typography variant="body2">
        <strong>Active region:</strong>{' '}
        {active ? active.name : '—'}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 0,
            border: 1,
            borderColor: 'divider',
            bgcolor: regionSwatchColor,
            flexShrink: 0,
          }}
          aria-hidden
        />
        <Typography variant="body2" color="text.secondary">
          {regionColorKey}
        </Typography>
      </Stack>

      <RegionPaintActiveRegionSelect
        activeRegionId={paint.activeRegionId}
        regionEntries={regionEntries}
        onSelectActiveRegion={onSelectActiveRegion}
      />

      <Button variant="outlined" size="small" onClick={onCreateRegion} sx={{ borderRadius: 0, alignSelf: 'flex-start' }}>
        New region
      </Button>

      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Preset colors
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 28px)',
          gap: 0.5,
          justifyContent: 'flex-start',
        }}
      >
        {LOCATION_MAP_REGION_COLOR_KEYS.map((key) => {
          const c = getMapRegionColor(key);
          const selected = regionColorKey === key;
          return (
            <Tooltip key={key} title={key} placement="top">
              <Box
                component="button"
                type="button"
                onClick={() => {
                  if (active) onActiveRegionColorKeyChange(key);
                }}
                disabled={!active}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 0,
                  border: 2,
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: c,
                  cursor: active ? 'pointer' : 'not-allowed',
                  p: 0,
                  boxShadow: selected ? 2 : 0,
                  opacity: active ? 1 : 0.45,
                }}
                aria-label={key}
                aria-pressed={selected}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Button
        variant="contained"
        size="small"
        onClick={onEditRegionInSelection}
        disabled={!active}
        sx={{ alignSelf: 'flex-start' }}
      >
        Edit region
      </Button>
    </Stack>
  );
}
