import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';

import type { BuildingWorkspaceFloorItem } from '@/features/content/locations/domain/building/buildingWorkspaceFloors';
import { floorTabLabelFromIndex } from '@/features/content/locations/domain/building/buildingWorkspaceFloors';

export type BuildingFloorStripProps = {
  floors: BuildingWorkspaceFloorItem[];
  activeFloorId: string | null;
  onSelectFloor: (id: string) => void;
  onAddFloor: () => void;
  adding?: boolean;
  disabled?: boolean;
};

export function BuildingFloorStrip({
  floors,
  activeFloorId,
  onSelectFloor,
  onAddFloor,
  adding = false,
  disabled = false,
}: BuildingFloorStripProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1,
        alignSelf: 'stretch',
        width: '100%',
        boxSizing: 'border-box',
        px: (theme) => theme.spacing(2),
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'grey.950',
        color: 'grey.100',
      }}
    >
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
      >
        {floors.map((f, index) => (
          <Button
            key={f.id}
            size="small"
            variant={activeFloorId === f.id ? 'contained' : 'text'}
            color={activeFloorId === f.id ? 'primary' : 'inherit'}
            onClick={() => onSelectFloor(f.id)}
            disabled={disabled}
          >
            {floorTabLabelFromIndex(index)}
          </Button>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddFloor}
          disabled={disabled || adding}
        >
          {adding ? 'Adding…' : 'Add floor'}
        </Button>
      </Stack>
    </Box>
  );
}
