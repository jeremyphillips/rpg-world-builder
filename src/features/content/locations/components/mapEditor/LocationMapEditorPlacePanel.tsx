import { createElement } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getLocationMapIconByName } from '@/features/content/locations/domain';
import type { MapPlacePaletteItem } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';

type LocationMapEditorPlacePanelProps = {
  items: MapPlacePaletteItem[];
  activeKind: LocationPlacedObjectKindId | null;
  onSelectKind: (kind: LocationPlacedObjectKindId) => void;
};

export function LocationMapEditorPlacePanel({
  items,
  activeKind,
  onSelectKind,
}: LocationMapEditorPlacePanelProps) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No placeable objects for this map scale.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" fontWeight={600}>
        Place on map
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 1,
        }}
      >
        {items.map((item) => {
          const selected = activeKind === item.kind;
          const Icon = item.iconName
            ? getLocationMapIconByName(item.iconName)
            : getLocationMapIconByName('marker');
          return (
            <Card
              key={item.kind}
              variant="outlined"
              sx={{
                borderColor: selected ? 'primary.main' : 'divider',
                borderWidth: selected ? 2 : 1,
              }}
            >
              <CardActionArea onClick={() => onSelectKind(item.kind)} sx={{ p: 1 }}>
                <Stack alignItems="center" spacing={0.5}>
                  {createElement(Icon, {
                    fontSize: 'small',
                    color: 'action',
                    'aria-hidden': true,
                  })}
                  <Typography variant="caption" textAlign="center" fontWeight={selected ? 600 : 400}>
                    {item.label}
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
}
