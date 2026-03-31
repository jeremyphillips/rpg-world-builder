import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import NearMeIcon from '@mui/icons-material/NearMe';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import LayersClearIcon from '@mui/icons-material/LayersClear';

import type { LocationMapEditorMode } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';
import { LOCATION_EDITOR_TOOLBAR_WIDTH_PX } from '@/features/content/locations/components/workspace/locationEditor.constants';

type LocationMapEditorToolbarProps = {
  mode: LocationMapEditorMode;
  onModeChange: (mode: LocationMapEditorMode) => void;
};

const TOOLS: {
  mode: LocationMapEditorMode;
  label: string;
  Icon: ComponentType<SvgIconProps>;
}[] = [
  { mode: 'select', label: 'Select', Icon: NearMeIcon },
  { mode: 'place', label: 'Place', Icon: AddLocationAltIcon },
  { mode: 'paint', label: 'Paint', Icon: FormatColorFillIcon },
  { mode: 'clear-fill', label: 'Clear fill', Icon: LayersClearIcon },
];

export function LocationMapEditorToolbar({ mode, onModeChange }: LocationMapEditorToolbarProps) {
  return (
    <Box
      sx={{
        width: LOCATION_EDITOR_TOOLBAR_WIDTH_PX,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 0.5,
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <ToggleButtonGroup
        orientation="vertical"
        value={mode}
        exclusive
        onChange={(_e, v) => {
          if (v != null) onModeChange(v as LocationMapEditorMode);
        }}
        sx={{ gap: 0.5 }}
      >
        {TOOLS.map((t) => (
          <ToggleButton
            key={t.mode}
            value={t.mode}
            size="small"
            aria-label={t.label}
            sx={{ px: 0.75, py: 0.5 }}
          >
            <t.Icon fontSize="small" />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
