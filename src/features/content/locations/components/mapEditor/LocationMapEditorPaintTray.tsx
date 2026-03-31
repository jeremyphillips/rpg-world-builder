import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

import type { MapPaintPaletteItem } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';
import type { LocationCellFillKindId } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import { getMapSwatchColor } from '@/app/theme/mapColors';

type LocationMapEditorPaintTrayProps = {
  items: MapPaintPaletteItem[];
  activePaint: LocationCellFillKindId | null;
  onSelectSwatch: (kind: LocationCellFillKindId) => void;
};

export function LocationMapEditorPaintTray({
  items,
  activePaint,
  onSelectSwatch,
}: LocationMapEditorPaintTrayProps) {
  if (items.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        py: 0.5,
        pr: 0.5,
        pl: 0.25,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        alignItems: 'center',
      }}
    >
      {items.map((item) => {
        const color = getMapSwatchColor(item.swatchColorKey);
        const selected = activePaint === item.fillKind;
        return (
          <Tooltip key={item.fillKind} title={item.label} placement="right">
            <Box
              component="button"
              type="button"
              onClick={() => onSelectSwatch(item.fillKind)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 0.5,
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
    </Box>
  );
}
