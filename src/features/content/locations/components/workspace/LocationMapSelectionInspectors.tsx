import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type {
  LocationMapEdgeAuthoringEntry,
  LocationMapPathAuthoringEntry,
} from '@/shared/domain/locations';

import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

import type { LocationCellObjectDraft } from '../locationGridDraft.types';

export type LocationMapObjectInspectorProps = {
  cellId: string;
  objectId: string;
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
};

export function LocationMapObjectInspector({
  cellId,
  objectId,
  objectsByCellId,
  onUpdateCellObjects,
}: LocationMapObjectInspectorProps) {
  const objs = objectsByCellId[cellId] ?? [];
  const obj = objs.find((o) => o.id === objectId);
  if (!obj) {
    return (
      <Typography variant="body2" color="text.secondary">
        This object is no longer on the map.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" fontWeight={600}>
          Placed object
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Cell {cellId}
        </Typography>
      </Box>
      <Chip size="small" label={obj.kind} variant="outlined" />
      <TextField
        label="Label"
        size="small"
        value={obj.label ?? ''}
        onChange={(e) => {
          const next = objs.map((o) =>
            o.id === objectId ? { ...o, label: e.target.value } : o,
          );
          onUpdateCellObjects(cellId, next);
        }}
        fullWidth
      />
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
        id: {objectId}
      </Typography>
      <Divider />
      <Button
        size="small"
        color="error"
        variant="outlined"
        onClick={() => {
          const next = objs.filter((o) => o.id !== objectId);
          onUpdateCellObjects(cellId, next);
        }}
      >
        Remove from map
      </Button>
    </Stack>
  );
}

export type LocationMapPathInspectorProps = {
  pathId: string;
  pathEntries: readonly LocationMapPathAuthoringEntry[];
};

export function LocationMapPathInspector({ pathId, pathEntries }: LocationMapPathInspectorProps) {
  const entry = pathEntries.find((p) => p.id === pathId);
  if (!entry) {
    return (
      <Typography variant="body2" color="text.secondary">
        This path is no longer on the map.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600}>
        Path
      </Typography>
      <Chip size="small" label={entry.kind} variant="outlined" />
      <Typography variant="body2" color="text.secondary">
        {entry.cellIds.length} cells in chain
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
        id: {pathId}
      </Typography>
    </Stack>
  );
}

export type LocationMapEdgeInspectorProps = {
  edgeId: string;
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
};

export function LocationMapEdgeInspector({ edgeId, edgeEntries }: LocationMapEdgeInspectorProps) {
  const entry = edgeEntries.find((e) => e.edgeId === edgeId);
  if (!entry) {
    return (
      <Typography variant="body2" color="text.secondary">
        This edge is no longer on the map.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600}>
        Boundary edge
      </Typography>
      <Chip size="small" label={entry.kind} variant="outlined" />
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {edgeId}
      </Typography>
    </Stack>
  );
}

const EDGE_RUN_AXIS_LABEL: Record<'horizontal' | 'vertical', string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
};

function edgeRunHumanLabel(kind: LocationMapEdgeKindId, axis: 'horizontal' | 'vertical'): string {
  const axisLabel = EDGE_RUN_AXIS_LABEL[axis];
  const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1);
  return `${axisLabel} ${kindLabel} run`;
}

export type LocationMapEdgeRunInspectorProps = {
  kind: LocationMapEdgeKindId;
  edgeIds: readonly string[];
  axis: 'horizontal' | 'vertical';
  anchorEdgeId: string;
};

export function LocationMapEdgeRunInspector({
  kind,
  edgeIds,
  axis,
  anchorEdgeId,
}: LocationMapEdgeRunInspectorProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600}>
        {edgeRunHumanLabel(kind, axis)}
      </Typography>
      <Chip size="small" label={kind} variant="outlined" />
      <Typography variant="body2" color="text.secondary">
        {edgeIds.length} segment{edgeIds.length === 1 ? '' : 's'} on this straight run
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Orientation: {axis} (square grid: {axis === 'horizontal' ? 'row' : 'column'} boundary line)
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
        Anchor: {anchorEdgeId}
      </Typography>
    </Stack>
  );
}
