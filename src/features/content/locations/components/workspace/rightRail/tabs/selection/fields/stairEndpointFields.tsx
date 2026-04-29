import { useEffect, useState } from 'react';

import type { Location } from '@/features/content/locations/domain/model/location';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LocationMapStairEndpointAuthoring } from '@/shared/domain/locations';
import {
  LOCATION_MAP_STAIR_ENDPOINT_DEFAULT_DIRECTION,
  LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS,
  resolveStairEndpointPairing,
} from '@/shared/domain/locations';

import {
  listStairObjectOptionsForFloor,
  parseStairObjectOptionValue,
} from '@/features/content/locations/domain/model/building/listStairObjectsOnFloorMap';

import { AppFormSelect } from '@/ui/patterns';
import type { SelectOption } from '@/ui/patterns/form/form.types';

import type { LocationCellObjectDraft } from '../../../../../authoring/draft/locationGridDraft.types';

import type { StairPairingContext, StairWorkspaceInspect } from '../inspectors/selectionInspectorTypes';

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
      <AppFormSelect
        name="remoteFloorId"
        label="Other floor"
        options={floorOptions}
        placeholder="Select floor"
        size="small"
        onAfterChange={() => setValue('remoteStairKey', '')}
      />
      <AppFormSelect
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

export function StairPairingControls({
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

type StairInspectorFormValues = {
  direction: string;
  targetFloorId: string;
};

export function LocationMapStairEndpointInspectForm({
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
  /** When using canonical building stair-connection pairing, omit draft-only target floor. */
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
        <AppFormSelect
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
            <AppFormSelect
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
