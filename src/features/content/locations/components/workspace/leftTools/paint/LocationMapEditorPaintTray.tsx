import type { MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { getMapSwatchColor } from '@/app/theme/mapColors';
import type {
  LocationMapPaintState,
  MapPaintPaletteItem,
} from '@/features/content/locations/domain/authoring/editor';
import type { LocationCellFillKindId } from '@/features/content/locations/domain/model/map/locationCellFill.types';

type LocationMapEditorPaintTrayProps = {
  items: MapPaintPaletteItem[];
  activePaint: LocationMapPaintState;
  onPaintChange: (next: LocationMapPaintState) => void;
};

export function LocationMapEditorPaintTray({
  items,
  activePaint,
  onPaintChange,
}: LocationMapEditorPaintTrayProps) {
  if (items.length === 0) return null;

  const domain = activePaint.domain;

  const handleDomainChange = (_: MouseEvent<HTMLElement>, value: 'surface' | 'region' | null) => {
    if (value == null) return;
    if (value === 'surface') {
      onPaintChange({ ...activePaint, domain: 'surface' });
      return;
    }
    onPaintChange({ ...activePaint, domain: 'region' });
  };

  const handleSelectSurface = (kind: LocationCellFillKindId) => {
    onPaintChange({
      ...activePaint,
      domain: 'surface',
      surfaceFillKind: kind,
    });
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        py: 0.5,
        pr: 0.5,
        pl: 0.25,
        alignItems: 'stretch',
        overflow: 'auto',
      }}
    >
      <ToggleButtonGroup
        exclusive
        value={domain}
        onChange={handleDomainChange}
        orientation="vertical"
        size="small"
        sx={{
          alignSelf: 'stretch',
          borderRadius: 0,
          '& .MuiToggleButton-root': { borderRadius: 0 },
        }}
      >
        <ToggleButton value="surface" aria-label="Surface paint">
          Surface
        </ToggleButton>
        <ToggleButton value="region" aria-label="Region paint">
          Region
        </ToggleButton>
      </ToggleButtonGroup>

      {domain === 'surface' ? (
        <Stack direction="column" spacing={0.75} alignItems="center">
          {items.map((item) => {
            const color = getMapSwatchColor(item.swatchColorKey);
            const selected = activePaint.surfaceFillKind === item.fillKind;
            return (
              <Tooltip key={item.fillKind} title={item.label} placement="right">
                <Box
                  component="button"
                  type="button"
                  onClick={() => handleSelectSurface(item.fillKind)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 0,
                    border: 2,
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: color,
                    cursor: 'pointer',
                    p: 0,
                    flexShrink: 0,
                    boxShadow: selected ? 2 : 0,
                  }}
                  aria-label={item.label}
                  aria-pressed={selected}
                />
              </Tooltip>
            );
          })}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.25 }}>
          Use the Map panel for region tools.
        </Typography>
      )}
    </Box>
  );
}
