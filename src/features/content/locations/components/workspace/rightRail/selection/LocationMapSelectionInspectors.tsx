import { useEffect, useState } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Location } from '@/features/content/locations/domain/model/location';
import {
  listStairObjectOptionsForFloor,
  parseStairObjectOptionValue,
} from '@/features/content/locations/domain/model/building/listStairObjectsOnFloorMap';

import type {
  LocationMapEdgeAuthoringEntry,
  LocationMapPathAuthoringEntry,
  LocationMapStairEndpointAuthoring,
} from '@/shared/domain/locations';
import {
  deriveLocationMapStairEndpointLinkStatus,
  LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
  LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS,
  resolveStairEndpointPairing,
  type LocationMapStairEndpointLinkStatus,
  type LocationVerticalStairConnection,
} from '@/shared/domain/locations';

import { FormSelectField } from '@/ui/patterns';
import type { SelectOption } from '@/ui/patterns/form/form.types';

import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

import type { LocationCellObjectDraft } from '../../../authoring/draft/locationGridDraft.types';

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

/**
 * Building workspace: canonical stair pairing API + resolver inputs.
 * **Traversal** is not implemented — pairing persistence only.
 */
export type StairPairingContext = {
  connections: LocationVerticalStairConnection[];
  campaignId: string;
  locations: Location[];
  onLink: (
    localCellId: string,
    localObjectId: string,
    remoteFloorId: string,
    remoteCellId: string,
    remoteObjectId: string,
  ) => Promise<void>;
  onUnlink: (localCellId: string, localObjectId: string) => Promise<void>;
};

function floorNameForId(locations: Location[], floorId: string): string {
  return locations.find((l) => l.id === floorId)?.name ?? floorId;
}

type StairPairingLinkFormValues = {
  remoteFloorId: string;
  remoteStairKey: string;
};

function StairPairingLinkFormFields({
  floorOptions,
  campaignId,
  cellId,
  objectId,
  onLinkPair,
}: {
  floorOptions: SelectOption[];
  campaignId: string;
  cellId: string;
  objectId: string;
  onLinkPair: (
    localCellId: string,
    localObjectId: string,
    remoteFloorId: string,
    remoteCellId: string,
    remoteObjectId: string,
  ) => Promise<void>;
}) {
  const { watch, setValue, getValues } = useFormContext<StairPairingLinkFormValues>();
  const remoteFloorId = watch('remoteFloorId');
  const [stairOpts, setStairOpts] = useState<SelectOption[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!remoteFloorId) {
      setStairOpts([]);
      setValue('remoteStairKey', '');
      return;
    }
    let cancelled = false;
    void listStairObjectOptionsForFloor(campaignId, remoteFloorId).then((rows) => {
      if (cancelled) return;
      setStairOpts(rows.map((r) => ({ value: r.value, label: r.label })));
    });
    return () => {
      cancelled = true;
    };
  }, [remoteFloorId, campaignId, setValue]);

  return (
    <>
      <FormSelectField
        name="remoteFloorId"
        label="Other floor"
        options={floorOptions}
        placeholder="Select floor"
        size="small"
        onAfterChange={() => setValue('remoteStairKey', '')}
      />
      <FormSelectField
        name="remoteStairKey"
        label="Stair on that floor"
        options={stairOpts}
        placeholder="Select stair"
        size="small"
        disabled={!remoteFloorId || stairOpts.length === 0}
      />
      <Button
        size="small"
        variant="contained"
        disabled={busy || !getValues('remoteStairKey')}
        onClick={async () => {
          const { remoteFloorId: floorId, remoteStairKey } = getValues();
          const parsed = parseStairObjectOptionValue(remoteStairKey);
          if (!parsed || !floorId) return;
          setBusy(true);
          try {
            await onLinkPair(cellId, objectId, floorId, parsed.cellId, parsed.objectId);
            setValue('remoteFloorId', '');
            setValue('remoteStairKey', '');
            setStairOpts([]);
          } catch {
            // Link validation failed (e.g. duplicate endpoint); keep selections for retry.
          } finally {
            setBusy(false);
          }
        }}
      >
        Link endpoints
      </Button>
    </>
  );
}

function StairPairingLinkForm({
  floors,
  campaignId,
  cellId,
  objectId,
  onLinkPair,
}: {
  floors: { id: string; label: string }[];
  campaignId: string;
  cellId: string;
  objectId: string;
  onLinkPair: (
    localCellId: string,
    localObjectId: string,
    remoteFloorId: string,
    remoteCellId: string,
    remoteObjectId: string,
  ) => Promise<void>;
}) {
  const floorOptions: SelectOption[] = floors.map((f) => ({ value: f.id, label: f.label }));
  const methods = useForm<StairPairingLinkFormValues>({
    defaultValues: { remoteFloorId: '', remoteStairKey: '' },
  });

  return (
    <FormProvider key={`${cellId}-${objectId}-pair`} {...methods}>
      <Stack spacing={2}>
        <StairPairingLinkFormFields
          floorOptions={floorOptions}
          campaignId={campaignId}
          cellId={cellId}
          objectId={objectId}
          onLinkPair={onLinkPair}
        />
      </Stack>
    </FormProvider>
  );
}

function StairPairingControls({
  stairPairingContext,
  stairWorkspaceInspect,
  cellId,
  objectId,
  pairing,
  onUpdateCellObjects,
  objs,
}: {
  stairPairingContext: StairPairingContext;
  stairWorkspaceInspect: StairWorkspaceInspect;
  cellId: string;
  objectId: string;
  pairing: ReturnType<typeof resolveStairEndpointPairing>;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
  objs: LocationCellObjectDraft[];
}) {
  const { campaignId, locations, onLink: onLinkPair, onUnlink } = stairPairingContext;
  const [busy, setBusy] = useState(false);

  if (pairing.kind === 'linked') {
    const c = pairing.counterpart;
    return (
      <Stack spacing={1}>
        <Chip size="small" label="Linked" color="success" variant="outlined" />
        <Typography variant="caption" color="text.secondary">
          Other endpoint: {floorNameForId(locations, c.floorLocationId)} · cell {c.cellId}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onUnlink(cellId, objectId);
            } finally {
              setBusy(false);
            }
          }}
        >
          Unlink
        </Button>
      </Stack>
    );
  }

  if (pairing.kind === 'orphaned') {
    return (
      <Stack spacing={1}>
        <Chip size="small" label="Stale stair link" color="warning" variant="outlined" />
        <Typography variant="caption" color="text.secondary">
          Map data references a connection that no longer exists. Clear the link id or remove this stair.
        </Typography>
        <Button
          size="small"
          onClick={() => {
            onUpdateCellObjects(
              cellId,
              objs.map((o) => {
                if (o.id !== objectId || o.kind !== 'stairs') return o;
                const base = o.stairEndpoint ?? { direction: LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION };
                return {
                  ...o,
                  stairEndpoint: {
                    direction: base.direction,
                    ...(base.targetLocationId?.trim() ? { targetLocationId: base.targetLocationId.trim() } : {}),
                  },
                };
              }),
            );
          }}
        >
          Clear stale connection id
        </Button>
      </Stack>
    );
  }

  const floors = stairWorkspaceInspect.candidateTargetFloors;

  return (
    <Stack spacing={1.5}>
      <Typography variant="caption" fontWeight={600}>
        Pair with stair on another floor
      </Typography>
      {floors.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Add another floor to the building to create a paired connection.
        </Typography>
      ) : (
        <StairPairingLinkForm
          floors={floors}
          campaignId={campaignId}
          cellId={cellId}
          objectId={objectId}
          onLinkPair={onLinkPair}
        />
      )}
    </Stack>
  );
}

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
  hideLegacyTargetFloor,
}: {
  cellId: string;
  objectId: string;
  objs: LocationCellObjectDraft[];
  stairEndpoint: LocationMapStairEndpointAuthoring | undefined;
  stairWorkspaceInspect: StairWorkspaceInspect;
  onUpdateCellObjects: (cellId: string, objects: LocationCellObjectDraft[]) => void;
  /** When using canonical {@link LocationVerticalStairConnection} pairing, omit draft-only target floor. */
  hideLegacyTargetFloor?: boolean;
}) {
  const directionOptions = LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS.map((d) => ({
    value: d,
    label: d,
  }));
  const targetOptions = stairWorkspaceInspect.candidateTargetFloors.map((f) => ({
    value: f.id,
    label: f.label,
  }));

  const stairMethods = useForm<StairInspectorFormValues>({
    defaultValues: {
      direction: stairEndpoint?.direction ?? LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
      targetFloorId: stairEndpoint?.targetLocationId ?? '',
    },
  });

  return (
    <FormProvider {...stairMethods}>
      <Stack spacing={2}>
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
        {!hideLegacyTargetFloor ? (
          <>
            <FormSelectField
              name="targetFloorId"
              label="Target floor (unpaired)"
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
                : 'Optional target when not using a paired connection below. Prefer pairing for a canonical link.'}
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary" component="div">
            Paired connection is the source of truth for the other endpoint. Combat traversal is still TODO.
          </Typography>
        )}
      </Stack>
    </FormProvider>
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
  /** Building edit: canonical stair pairing; omit outside building floor maps. */
  stairPairingContext?: StairPairingContext;
};

export function LocationMapObjectInspector({
  cellId,
  objectId,
  objectsByCellId,
  onUpdateCellObjects,
  onRemovePlacedObjectFromMap,
  hostScale,
  stairWorkspaceInspect,
  stairPairingContext,
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
  const endpointRef = {
    floorLocationId: stairWorkspaceInspect.currentFloorLocationId,
    cellId,
    objectId,
  };
  const pairing = showStairEndpointUi
    ? resolveStairEndpointPairing(
        stairPairingContext?.connections,
        endpointRef,
        obj.stairEndpoint?.connectionId,
      )
    : null;
  const linkStatus =
    showStairEndpointUi && !stairPairingContext
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
              One endpoint on this floor. Paired connections are stored on the building; combat traversal is still TODO.
            </Typography>
          </Box>
          {stairPairingContext && pairing ? (
            <StairPairingControls
              stairPairingContext={stairPairingContext}
              stairWorkspaceInspect={stairWorkspaceInspect}
              cellId={cellId}
              objectId={objectId}
              pairing={pairing}
              onUpdateCellObjects={onUpdateCellObjects}
              objs={objs}
            />
          ) : null}
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
            hideLegacyTargetFloor={Boolean(stairPairingContext)}
          />
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
