import { useMemo } from 'react';

import Box from '@mui/material/Box';
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
  resolvePlacedObjectKindForCellObject,
} from '@/features/content/locations/domain';
import { buildLinkedLocationPickerOptions } from '@/features/content/locations/domain/authoring/editor';
import { getDefaultVariantPresentationForKind } from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';

import { deriveLocationMapStairEndpointLinkStatus, resolveStairEndpointPairing } from '@/shared/domain/locations';

import type { LocationCellObjectDraft } from '../../../../../authoring/draft/locationGridDraft.types';

import { LinkedLocationPickerField } from '../fields/linkedLocationPickerField';
import { STAIR_LINK_STATUS_LABEL } from '../fields/stairLinkStatusLabels';
import { LocationMapStairEndpointInspectForm, StairPairingControls } from '../fields/stairEndpointFields';
import {
  SelectionMetadataRows,
  SelectionRailTemplate,
} from '../templates/SelectionRailTemplate';
import {
  formatCellPlacementLine,
  legacyMapObjectKindTitle,
  presentationRowsFromPresentation,
  shouldShowLinkedIdentityForPlacedObject,
} from '../selectionRail.helpers';

import type { StairPairingContext, StairWorkspaceInspect } from './selectionInspectorTypes';

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
      <LinkedLocationPickerField
        linkedScale={linkedScaleTarget}
        options={linkedPickerOptions}
        value={linkedLocationId}
        onChange={(next) => {
          onUpdateLinkedLocation(cellId, next);
        }}
        campaignId={campaignId}
        hostEditLocationSource={hostEditLocation?.source}
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
