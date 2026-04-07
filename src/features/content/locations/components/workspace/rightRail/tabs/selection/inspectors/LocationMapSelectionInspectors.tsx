import { useEffect, useMemo, useState } from 'react';

import type { LocationScaleId } from '@/shared/domain/locations';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Location } from '@/features/content/locations/domain/model/location';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';
import {
  getPlacedObjectMeta,
  getPlacedObjectDefinition,
  getPlacedObjectPaletteCategoryId,
  getPlacedObjectPaletteCategoryLabel,
  resolveAuthoredEdgeInstance,
  resolvePlacedObjectKindForCellObject,
} from '@/features/content/locations/domain';
import { buildLinkedLocationPickerOptions } from '@/features/content/locations/domain/authoring/editor';
import { getDefaultVariantPresentationForKind } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
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

import OptionPickerField from '@/ui/patterns/form/OptionPickerField';
import { FormSelectField } from '@/ui/patterns';
import type { SelectOption } from '@/ui/patterns/form/form.types';

import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

import type { LocationCellObjectDraft } from '../../../../../authoring/draft/locationGridDraft.types';

import {
  SelectionMetadataRows,
  SelectionRailTemplate,
} from '../templates/SelectionRailTemplate';
import {
  formatCellPlacementLine,
  formatEdgePlacementLine,
  legacyMapObjectKindTitle,
  presentationRowsFromPresentation,
  shouldShowLinkedIdentityForPlacedObject,
} from '../selectionRail.helpers';

/** Label for the map link picker; keyed by registry `linkedScale` (target kind / tier). */
function linkedTargetPickerFieldLabel(linkedScale: LocationScaleId): string {
  switch (linkedScale) {
    case 'city':
      return 'Linked city';
    case 'building':
      return 'Linked building';
    case 'site':
      return 'Linked site';
    default:
      return 'Linked location';
  }
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
  campaignId?: string;
  mapHostLocationId: string;
  mapHostScale: string;
  hostEditLocation: LocationContentItem | null;
  onUpdateLinkedLocation: (cellId: string, locationId: string | undefined) => void;
  /** Campaign locations — resolve linked cell → location name for linked-content display identity. */
  locations: Location[];
  /** One linked campaign location id per cell (same source as cell inspector). */
  linkedLocationByCellId: Record<string, string | undefined>;
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
  campaignId,
  mapHostLocationId,
  mapHostScale,
  hostEditLocation,
  onUpdateLinkedLocation,
  locations,
  linkedLocationByCellId,
  stairWorkspaceInspect,
  stairPairingContext,
}: LocationMapObjectInspectorProps) {
  const objs = objectsByCellId[cellId] ?? [];
  const obj = objs.find((o) => o.id === objectId);

  const locationById = useMemo(
    () => new Map(locations.map((l) => [l.id, l] as const)),
    [locations],
  );

  const resolvedPlacedKind = obj ? resolvePlacedObjectKindForCellObject(obj) : null;
  const linkedLocationId = linkedLocationByCellId[cellId];
  const linkedLoc = linkedLocationId ? locationById.get(linkedLocationId) : undefined;
  const linkedScaleTarget =
    resolvedPlacedKind !== null
      ? getPlacedObjectDefinition(resolvedPlacedKind).linkedScale
      : undefined;
  const linkedPickerOptions =
    linkedScaleTarget !== undefined
      ? buildLinkedLocationPickerOptions({
          campaignId,
          loc: hostEditLocation,
          locations,
          mapHostLocationIdResolved: mapHostLocationId,
          mapHostScaleResolved: mapHostScale,
          linkedScale: linkedScaleTarget,
        })
      : [];

  if (!obj) {
    return (
      <Typography variant="body2" color="text.secondary">
        This object is no longer on the map.
      </Typography>
    );
  }

  const showLinkedDisplayIdentity = shouldShowLinkedIdentityForPlacedObject(
    resolvedPlacedKind,
    linkedLocationId,
    linkedLoc,
  );

  const categoryLabel = resolvedPlacedKind
    ? getPlacedObjectPaletteCategoryLabel(getPlacedObjectPaletteCategoryId(resolvedPlacedKind))
    : 'Object';
  const objectTitle = resolvedPlacedKind
    ? getPlacedObjectMeta(resolvedPlacedKind).label
    : legacyMapObjectKindTitle(obj.kind);
  const placementLine = formatCellPlacementLine(cellId);

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

  const presentationRows =
    resolvedPlacedKind !== null
      ? presentationRowsFromPresentation(getDefaultVariantPresentationForKind(resolvedPlacedKind))
      : [];
  const presentationBlock =
    presentationRows.length > 0 ? <SelectionMetadataRows rows={presentationRows} /> : null;

  const linkedTargetPicker =
    linkedScaleTarget !== undefined ? (
      <OptionPickerField
        label={linkedTargetPickerFieldLabel(linkedScaleTarget)}
        options={linkedPickerOptions}
        value={linkedLocationId ? [linkedLocationId] : []}
        onChange={(next) => {
          onUpdateLinkedLocation(cellId, next[0]);
        }}
        maxItems={1}
        helperText={
          !campaignId || hostEditLocation?.source !== 'campaign'
            ? 'Link targets are available for campaign locations only.'
            : linkedPickerOptions.length === 0
              ? 'No locations match this link type for the current map.'
              : undefined
        }
        emptyMessage="No locations available."
      />
    ) : null;

  const stairMetadata =
    showStairEndpointUi ? (
      <Stack spacing={2}>
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
      </Stack>
    ) : null;

  const composedMetadata =
    linkedTargetPicker || presentationBlock || stairMetadata ? (
      <Stack spacing={2}>
        {linkedTargetPicker}
        {presentationBlock}
        {stairMetadata}
      </Stack>
    ) : undefined;

  const labelOrLinkedChild =
    showLinkedDisplayIdentity && linkedLoc ? (
      <Typography variant="body1" fontWeight={500}>
        {linkedLoc.name}
      </Typography>
    ) : !showLinkedDisplayIdentity ? (
      <TextField
        label="Label"
        size="small"
        value={obj.label ?? ''}
        onChange={(e) => {
          const next = objs.map((o) => (o.id === objectId ? { ...o, label: e.target.value } : o));
          onUpdateCellObjects(cellId, next);
        }}
        fullWidth
      />
    ) : null;

  return (
    <SelectionRailTemplate
      categoryLabel={categoryLabel}
      title={objectTitle}
      placementLine={placementLine}
      metadata={composedMetadata}
      onRemoveFromMap={() => {
        if (onRemovePlacedObjectFromMap) {
          onRemovePlacedObjectFromMap(cellId, objectId);
          return;
        }
        const next = objs.filter((o) => o.id !== objectId);
        onUpdateCellObjects(cellId, next);
      }}
    >
      {labelOrLinkedChild}
    </SelectionRailTemplate>
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

  const metadata = <Chip size="small" label={entry.kind} variant="outlined" />;

  return (
    <SelectionRailTemplate
      categoryLabel="Map"
      title="Path"
      placementLine={`Chain · ${entry.cellIds.length} cell${entry.cellIds.length === 1 ? '' : 's'}`}
      metadata={metadata}
      onRemoveFromMap={onRemovePathFromMap ? () => onRemovePathFromMap(pathId) : undefined}
    />
  );
}

export type LocationMapEdgeInspectorProps = {
  edgeId: string;
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  /** When set, “Remove from map” uses the same draft path as Erase on that edge. */
  onRemoveEdgeFromMap?: (edgeId: string) => void;
  onPatchEdgeEntry?: (
    edgeId: string,
    patch: Partial<Pick<LocationMapEdgeAuthoringEntry, 'label'>>,
  ) => void;
};

export function LocationMapEdgeInspector({
  edgeId,
  edgeEntries,
  onRemoveEdgeFromMap,
  onPatchEdgeEntry,
}: LocationMapEdgeInspectorProps) {
  const entry = edgeEntries.find((e) => e.edgeId === edgeId);
  if (!entry) {
    return (
      <Typography variant="body2" color="text.secondary">
        This edge is no longer on the map.
      </Typography>
    );
  }

  const resolved = resolveAuthoredEdgeInstance(entry);
  const isDoorOrWindow = resolved.placedKind === 'door' || resolved.placedKind === 'window';
  const placementLine = formatEdgePlacementLine(edgeId);

  const presentationRows = isDoorOrWindow
    ? presentationRowsFromPresentation(resolved.presentation)
    : [];

  const metadata = isDoorOrWindow ? (
    <Stack spacing={1}>
      <SelectionMetadataRows rows={presentationRows} />
      {resolved.legacyIdentityFallback ? (
        <Typography variant="caption" color="text.secondary">
          This segment predates saved door/window identity — metadata uses the default variant until you re-place or
          the map is saved with upgraded edge data.
        </Typography>
      ) : null}
    </Stack>
  ) : (
    <Typography variant="body2" color="text.secondary">
      Boundary wall segment.
    </Typography>
  );

  const edgeLabelField = isDoorOrWindow ? (
    <TextField
      label="Label"
      size="small"
      value={entry.label ?? ''}
      onChange={(e) => onPatchEdgeEntry?.(edgeId, { label: e.target.value })}
      fullWidth
    />
  ) : undefined;

  return (
    <SelectionRailTemplate
      categoryLabel={resolved.categoryLabel}
      title={resolved.objectTitle}
      placementLine={placementLine}
      metadata={metadata}
      onRemoveFromMap={onRemoveEdgeFromMap ? () => onRemoveEdgeFromMap(edgeId) : undefined}
    >
      {edgeLabelField}
    </SelectionRailTemplate>
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
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  /** When set, removes every segment in this run (same as map Delete for edge-run). */
  onRemoveEdgeRunFromMap?: (edgeIds: readonly string[]) => void;
  onPatchEdgeEntry?: (
    edgeId: string,
    patch: Partial<Pick<LocationMapEdgeAuthoringEntry, 'label'>>,
  ) => void;
};

export function LocationMapEdgeRunInspector({
  kind,
  edgeIds,
  axis,
  anchorEdgeId,
  edgeEntries,
  onRemoveEdgeRunFromMap,
  onPatchEdgeEntry,
}: LocationMapEdgeRunInspectorProps) {
  const anchorEntry =
    edgeEntries.find((e) => e.edgeId === anchorEdgeId) ?? ({ edgeId: anchorEdgeId, kind } as LocationMapEdgeAuthoringEntry);

  const resolved = resolveAuthoredEdgeInstance(anchorEntry);
  const isDoorOrWindow = resolved.placedKind === 'door' || resolved.placedKind === 'window';
  const objectTitle = isDoorOrWindow
    ? resolved.objectTitle
    : edgeRunHumanLabel(kind, axis);
  const categoryLabel = isDoorOrWindow ? resolved.categoryLabel : 'Structure';

  /** Object-first: anchor placement is primary for door/window; wall runs stay geometry-forward. */
  const placementLine = isDoorOrWindow
    ? formatEdgePlacementLine(anchorEdgeId)
    : `Straight run · ${edgeIds.length} segment${edgeIds.length === 1 ? '' : 's'}`;

  const presentationRows = isDoorOrWindow
    ? presentationRowsFromPresentation(resolved.presentation)
    : [];

  const metadataEdgeRun = isDoorOrWindow ? (
    <Stack spacing={1}>
      <SelectionMetadataRows rows={presentationRows} />
      {resolved.legacyIdentityFallback ? (
        <Typography variant="caption" color="text.secondary">
          Anchor segment predates saved door/window identity — metadata uses the default variant until re-placed or
          upgraded on save.
        </Typography>
      ) : null}
    </Stack>
  ) : (
    <Stack spacing={1}>
      <Typography variant="body2" color="text.secondary">
        {edgeIds.length} segment{edgeIds.length === 1 ? '' : 's'} on this straight run
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Orientation: {axis} (square grid: {axis === 'horizontal' ? 'row' : 'column'} boundary line)
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Anchor: {formatEdgePlacementLine(anchorEdgeId)}
      </Typography>
    </Stack>
  );

  const edgeLabelField = isDoorOrWindow ? (
    <TextField
      label="Label"
      size="small"
      value={anchorEntry.label ?? ''}
      onChange={(e) => onPatchEdgeEntry?.(anchorEdgeId, { label: e.target.value })}
      fullWidth
    />
  ) : undefined;

  return (
    <SelectionRailTemplate
      categoryLabel={categoryLabel}
      title={objectTitle}
      placementLine={placementLine}
      metadata={metadataEdgeRun}
      onRemoveFromMap={onRemoveEdgeRunFromMap ? () => onRemoveEdgeRunFromMap(edgeIds) : undefined}
    >
      {edgeLabelField}
    </SelectionRailTemplate>
  );
}
