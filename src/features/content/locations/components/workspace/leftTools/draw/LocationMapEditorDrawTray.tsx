import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type {
  LocationMapActiveDrawSelection,
  MapDrawPaletteItem,
} from '@/features/content/locations/domain/mapEditor';

type LocationMapEditorDrawTrayProps = {
  items: MapDrawPaletteItem[];
  activeDraw: LocationMapActiveDrawSelection;
  onSelectDraw: (selection: LocationMapActiveDrawSelection) => void;
};

function drawKey(sel: LocationMapActiveDrawSelection): string | null {
  if (!sel) return null;
  if (sel.category === 'path') return `path:${sel.kind}`;
  return `edge:${sel.kind}`;
}

function itemKey(item: MapDrawPaletteItem): string {
  if (item.category === 'path') return `path:${item.kind}`;
  return `edge:${item.kind}`;
}

export function LocationMapEditorDrawTray({
  items,
  activeDraw,
  onSelectDraw,
}: LocationMapEditorDrawTrayProps) {
  if (items.length === 0) return null;

  const activeKey = drawKey(activeDraw);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        py: 0.5,
        pr: 0.5,
        pl: 0.25,
        alignItems: 'center',
        overflow: 'auto',
      }}
    >
      {items.map((item) => {
        const key = itemKey(item);
        const selected = activeKey === key;
        const onClick = () => {
          if (item.category === 'path') {
            onSelectDraw({ category: 'path', kind: item.kind });
          } else {
            onSelectDraw({ category: 'edge', kind: item.kind });
          }
        };
        return (
          <Tooltip key={key} title={item.label} placement="right">
            <Box
              component="button"
              type="button"
              onClick={onClick}
              sx={{
                width: 28,
                minHeight: 28,
                px: 0.25,
                borderRadius: 0.5,
                border: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: 'action.hover',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: selected ? 2 : 0,
              }}
              aria-label={item.label}
              aria-pressed={selected}
            >
              <Typography variant="caption" fontWeight={selected ? 700 : 500} sx={{ lineHeight: 1, fontSize: 10 }}>
                {item.label.length <= 2 ? item.label : item.label.slice(0, 2)}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}
