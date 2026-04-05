import { createElement } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getLocationMapGlyphIconByName } from '@/features/content/locations/domain';
import type {
  LocationMapActivePlaceSelection,
  MapPlacePaletteItem,
} from '@/features/content/locations/domain/authoring/editor';

function selectionKey(sel: LocationMapActivePlaceSelection): string | null {
  if (!sel) return null;
  if (sel.category === 'linked-content') return `linked:${sel.kind}`;
  return `object:${sel.kind}`;
}

function itemKey(item: MapPlacePaletteItem): string {
  if (item.category === 'linked-content') return `linked:${item.kind}`;
  return `object:${item.kind}`;
}

type LocationMapEditorPlacePanelProps = {
  items: MapPlacePaletteItem[];
  activePlace: LocationMapActivePlaceSelection;
  onSelectPlace: (selection: LocationMapActivePlaceSelection) => void;
};

export function LocationMapEditorPlacePanel({
  items,
  activePlace,
  onSelectPlace,
}: LocationMapEditorPlacePanelProps) {
  const linkedItems = items.filter(
    (i): i is Extract<MapPlacePaletteItem, { category: 'linked-content' }> => i.category === 'linked-content',
  );
  const objectItems = items.filter(
    (i): i is Extract<MapPlacePaletteItem, { category: 'map-object' }> => i.category === 'map-object',
  );

  const activeKey = selectionKey(activePlace);

  const renderCard = (item: MapPlacePaletteItem) => {
    const key = itemKey(item);
    const selected = activeKey === key;
    const Icon = item.iconName
      ? getLocationMapGlyphIconByName(item.iconName)
      : getLocationMapGlyphIconByName('marker');
    const onClick = () => {
      if (item.category === 'linked-content') {
        onSelectPlace({ category: 'linked-content', kind: item.kind });
      } else {
        onSelectPlace({ category: 'map-object', kind: item.kind });
      }
    };
    return (
      <Card
        key={key}
        variant="outlined"
        sx={{
          borderColor: selected ? 'primary.main' : 'divider',
          borderWidth: selected ? 2 : 1,
        }}
      >
        <CardActionArea onClick={onClick} sx={{ p: 1 }}>
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
  };

  const grid = (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 1,
      }}
    >
      {items.map((item) => renderCard(item))}
    </Box>
  );

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No placeable content for this map scale.
      </Typography>
    );
  }

  const hasGroups = linkedItems.length > 0 && objectItems.length > 0;

  if (!hasGroups) {
    return (
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          Place on map
        </Typography>
        {grid}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" fontWeight={600}>
        Place on map
      </Typography>
      {linkedItems.length > 0 ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Linked content
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 1,
            }}
          >
            {linkedItems.map((item) => renderCard(item))}
          </Box>
        </Box>
      ) : null}
      {objectItems.length > 0 ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Map objects
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 1,
            }}
          >
            {objectItems.map((item) => renderCard(item))}
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}
