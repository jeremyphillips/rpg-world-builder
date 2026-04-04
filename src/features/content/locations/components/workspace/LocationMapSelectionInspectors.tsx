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
  LocationMapStairEndpointAuthoring,
} from '@/shared/domain/locations';
import {
  deriveLocationMapStairEndpointLinkStatus,
  LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
  LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS,
  type LocationMapStairEndpointLinkStatus,
} from '@/shared/domain/locations';

import { AppForm, FormSelectField } from '@/ui/patterns';

import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

import type { LocationCellObjectDraft } from '../locationGridDraft.types';

/** Divider + “Remove from map” for map selection inspectors (shared styling). */
function MapInspectorRemoveFromMapButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <Divider />
      <Button size="small" color="error" variant="outlined" onClick={onClick}>
        Remove from map
      </Button>
    </>
  );
}

function MapInspectorRemoveFromMapIfHandler({ onRemove }: { onRemove?: () => void }) {
  if (!onRemove) return null;
  return <MapInspectorRemoveFromMapButton onClick={onRemove} />;
}

/** Floor list for stair target picker (sibling floors under the same building, excluding the map’s floor). */
export type StairWorkspaceInspect = {
  currentFloorLocationId: string;
  candidateTargetFloors: { id: string; label: string }[];
};

const STAIR_LINK_STATUS_LABEL: Record<LocationMapStairEndpointLinkStatus, string> = {
  unlinked: 'Unlinked',
  incomplete: 'Incomplete',
  linked: 'Linked',
  invalid: 'Invalid',
};

type StairInspectorFormValues = {
  direction: string;
  targetFloorId: string;
};

function LocationMapStairEndpointInspectForm({
  cellId,
  objectId,
  objs,
  stairEndpoint,
  stairWorkspaceInspect,
  onUpdateCellObjects,
}: {
  cellId: string;
  objectId: string;
  objs: LocationCellObjectDraft[];
  stairEndpoint: LocationMapStairEndpointAuthoring | undefined;
  stairWorkspaceInspect: StairWorkspaceInspect;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
}) {
  const directionOptions = LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS.map((d) => ({
    value: d,
    label: d,
  }));
  const targetOptions = stairWorkspaceInspect.candidateTargetFloors.map((f) => ({
    value: f.id,
    label: f.label,
  }));

  const defaultValues: StairInspectorFormValues = {
    direction: stairEndpoint?.direction ?? LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
    targetFloorId: stairEndpoint?.targetLocationId ?? '',
  };

  return (
    <AppForm<StairInspectorFormValues>
      defaultValues={defaultValues}
      onSubmit={() => {}}
      spacing={2}
    >
      <FormSelectField
        name="direction"
        label="Direction"
        options={directionOptions}
        size="small"
        onAfterChange={(direction) => {
          onUpdateCellObjects(
            cellId,
            objs.map((o) => {
              if (o.id !== objectId || o.kind !== 'stairs') return o;
              const base = o.stairEndpoint ?? { direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION };
              return {
                ...o,
                stairEndpoint: {
                  ...base,
                  direction: direction as (typeof LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS)[number],
                },
              };
            }),
          );
        }}
      />
      <FormSelectField
        name="targetFloorId"
        label="Target floor"
        options={targetOptions}
        placeholder="None"
        size="small"
        onAfterChange={(v) => {
          const trimmed = v.trim();
          onUpdateCellObjects(
            cellId,
            objs.map((o) => {
              if (o.id !== objectId || o.kind !== 'stairs') return o;
              const base = o.stairEndpoint ?? { direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION };
              return {
                ...o,
                stairEndpoint: {
                  direction: base.direction,
                  ...(base.connectionId ? { connectionId: base.connectionId } : {}),
                  ...(trimmed !== '' ? { targetLocationId: trimmed } : {}),
                },
              };
            }),
          );
        }}
      />
      <Typography variant="caption" color="text.secondary" component="div">
        {stairWorkspaceInspect.candidateTargetFloors.length === 0
          ? 'Add another floor to this building to choose a target floor. You can still place stairs while drafting.'
          : 'Optional: intended floor for this stair. Reciprocal endpoint and runtime movement are still TODO.'}
      </Typography>
    </AppForm>
  );
}

export type LocationMapObjectInspectorProps = {
  cellId: string;
  objectId: string;
  objectsByCellId: Record<string, LocationCellObjectDraft[]>;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
  /** When set, “Remove from map” uses the same draft path as Erase (and clears selection when it matches). */
  onRemovePlacedObjectFromMap?: (cellId: string, objectId: string) => void;
  hostScale: string;
  stairWorkspaceInspect: StairWorkspaceInspect;
};

export function LocationMapObjectInspector({
  cellId,
  objectId,
  objectsByCellId,
  onUpdateCellObjects,
  onRemovePlacedObjectFromMap,
  hostScale,
  stairWorkspaceInspect,
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

  const showStairEndpointUi = obj.kind === 'stairs' && hostScale === 'floor';
  const validTargetFloorIds = stairWorkspaceInspect.candidateTargetFloors.map((f) => f.id);
  const linkStatus = showStairEndpointUi
    ? deriveLocationMapStairEndpointLinkStatus({
        stairEndpoint: obj.stairEndpoint,
        currentFloorLocationId: stairWorkspaceInspect.currentFloorLocationId,
        validTargetFloorIds,
      })
    : null;

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
      {showStairEndpointUi ? (
        <>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              Staircase endpoint
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              One endpoint on this floor. Full vertical pairing and combat traversal are not implemented yet.
            </Typography>
          </Box>
          {linkStatus !== null ? (
            <Chip
              size="small"
              label={STAIR_LINK_STATUS_LABEL[linkStatus]}
              color={linkStatus === 'linked' ? 'success' : linkStatus === 'invalid' ? 'error' : 'default'}
              variant="outlined"
            />
          ) : null}
          <LocationMapStairEndpointInspectForm
            key={`${cellId}-${objectId}`}
            cellId={cellId}
            objectId={objectId}
            objs={objs}
            stairEndpoint={obj.stairEndpoint}
            stairWorkspaceInspect={stairWorkspaceInspect}
            onUpdateCellObjects={onUpdateCellObjects}
          />
          {obj.stairEndpoint?.connectionId ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              connectionId: {obj.stairEndpoint.connectionId}
            </Typography>
          ) : null}
        </>
      ) : null}
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
      <MapInspectorRemoveFromMapButton
        onClick={() => {
          if (onRemovePlacedObjectFromMap) {
            onRemovePlacedObjectFromMap(cellId, objectId);
            return;
          }
          const next = objs.filter((o) => o.id !== objectId);
          onUpdateCellObjects(cellId, next);
        }}
      />
    </Stack>
  );
}

export type LocationMapPathInspectorProps = {
  pathId: string;
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  /** When set, “Remove from map” removes the whole chain (same as map Delete for paths). */
  onRemovePathFromMap?: (pathId: string) => void;
};

export function LocationMapPathInspector({
  pathId,
  pathEntries,
  onRemovePathFromMap,
}: LocationMapPathInspectorProps) {
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
      <MapInspectorRemoveFromMapIfHandler
        onRemove={onRemovePathFromMap ? () => onRemovePathFromMap(pathId) : undefined}
      />
    </Stack>
  );
}

export type LocationMapEdgeInspectorProps = {
  edgeId: string;
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  /** When set, “Remove from map” uses the same draft path as Erase on that edge. */
  onRemoveEdgeFromMap?: (edgeId: string) => void;
};

export function LocationMapEdgeInspector({
  edgeId,
  edgeEntries,
  onRemoveEdgeFromMap,
}: LocationMapEdgeInspectorProps) {
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
      <MapInspectorRemoveFromMapIfHandler
        onRemove={onRemoveEdgeFromMap ? () => onRemoveEdgeFromMap(edgeId) : undefined}
      />
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
  /** When set, removes every segment in this run (same as map Delete for edge-run). */
  onRemoveEdgeRunFromMap?: (edgeIds: readonly string[]) => void;
};

export function LocationMapEdgeRunInspector({
  kind,
  edgeIds,
  axis,
  anchorEdgeId,
  onRemoveEdgeRunFromMap,
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
      <MapInspectorRemoveFromMapIfHandler
        onRemove={onRemoveEdgeRunFromMap ? () => onRemoveEdgeRunFromMap(edgeIds) : undefined}
      />
    </Stack>
  );
}
