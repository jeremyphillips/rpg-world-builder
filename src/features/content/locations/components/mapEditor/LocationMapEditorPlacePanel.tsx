import { createElement } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { getLocationMapIconByName } from '@/features/content/locations/domain';
import type {
  LocationMapActivePlaceSelection,
  MapPlacePaletteItem,
} from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';

function selectionKey(sel: LocationMapActivePlaceSelection): string | null {
  if (!sel) return null;
  if (sel.category === 'object') return `object:${sel.kind}`;
  if (sel.category === 'path') return `path:${sel.kind}`;
  return `edge:${sel.kind}`;
}

function itemKey(item: MapPlacePaletteItem): string {
  if (item.category === 'object') return `object:${item.kind}`;
  if (item.category === 'path') return `path:${item.kind}`;
  return `edge:${item.kind}`;
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
  const objectItems = items.filter((i): i is Extract<MapPlacePaletteItem, { category: 'object' }> => i.category === 'object');
  const pathItems = items.filter((i): i is Extract<MapPlacePaletteItem, { category: 'path' }> => i.category === 'path');
  const edgeItems = items.filter((i): i is Extract<MapPlacePaletteItem, { category: 'edge' }> => i.category === 'edge');

  const activeKey = selectionKey(activePlace);

  const renderCard = (item: MapPlacePaletteItem) => {
    const key = itemKey(item);
    const selected = activeKey === key;
    const Icon =
      item.category === 'object' && item.iconName
        ? getLocationMapIconByName(item.iconName)
        : getLocationMapIconByName('marker');
    const onClick = () => {
      if (item.category === 'object') {
        onSelectPlace({ category: 'object', kind: item.kind });
      } else if (item.category === 'path') {
        onSelectPlace({ category: 'path', kind: item.kind });
      } else {
        onSelectPlace({ category: 'edge', kind: item.kind });
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

  const hasGroups = objectItems.length > 0 && (pathItems.length > 0 || edgeItems.length > 0);

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
      {objectItems.length > 0 ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Objects
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
      {pathItems.length > 0 ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Paths
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}>
            Click two neighboring cells (up/down/left/right) to place one segment. The dashed line is
            a preview; the solid line is saved on the second click. Press Esc to cancel the first
            click. Switch to Select when you are done placing.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 1,
            }}
          >
            {pathItems.map((item) => renderCard(item))}
          </Box>
        </Box>
      ) : null}
      {edgeItems.length > 0 ? (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Edges (walls / windows / doors)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}>
            Hover near a cell boundary to preview. Click or drag across boundaries to place
            connected edge segments. Release to commit. Dragging locks to a straight line;
            hold Shift to change direction mid-stroke. Use Erase mode to remove individual edges.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 1,
            }}
          >
            {edgeItems.map((item) => renderCard(item))}
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}
