import type { MutableRefObject } from 'react';
import Typography from '@mui/material/Typography';

import type { LocationMapEdgeAuthoringEntry, LocationMapPathAuthoringEntry } from '@/shared/domain/locations';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';

import type { LocationMapSelection } from '../../types';
import {
  LocationMapEdgeInspector,
  LocationMapEdgeRunInspector,
  LocationMapObjectInspector,
  LocationMapPathInspector,
  type StairPairingContext,
  type StairWorkspaceInspect,
} from './inspectors/LocationMapSelectionInspectors';
import {
  CellSelectionInspector,
  type CellSelectionInspectorProps,
} from './inspectors/CellSelectionInspector';
import { LocationMapRegionMetadataForm } from './inspectors/LocationMapRegionMetadataForm';

export type { StairWorkspaceInspect, StairPairingContext };

export type SelectionTabProps = {
  selection: LocationMapSelection;
  /** Passed through for `cell` (same props the route already used for the cell inspector). */
  cellPanelProps: CellSelectionInspectorProps;
  /** Sibling floors for stair target picker; current floor id for link status. */
  stairWorkspaceInspect: StairWorkspaceInspect;
  /** Building edit: canonical stair connections + link/unlink handlers. */
  stairPairingContext?: StairPairingContext;
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  regionEntries: readonly LocationMapRegionAuthoringEntry[];
  onUpdateRegionEntry: (
    regionId: string,
    patch: Partial<Pick<LocationMapRegionAuthoringEntry, 'name' | 'description' | 'colorKey'>>,
  ) => void;
  /** Uses erase/delete draft path (same as Erase on that object); clears map selection when it matches. */
  onRemovePlacedObjectFromMap?: (cellId: string, objectId: string) => void;
  /** Removes the whole path chain (same as Delete when a path is selected). */
  onRemovePathFromMap?: (pathId: string) => void;
  /** Single boundary edge (same as Erase / Delete for that edge). */
  onRemoveEdgeFromMap?: (edgeId: string) => void;
  /** All segments in the selected straight run (same as Delete for edge-run). */
  onRemoveEdgeRunFromMap?: (edgeIds: readonly string[]) => void;
  /** Removes the region entry and all cell assignments (same as Delete when a region is selected). */
  onRemoveRegionFromMap?: (regionId: string) => void;
  /** Persisted edge row patch (e.g. label) — same draft as map save. */
  onPatchEdgeEntry?: (
    edgeId: string,
    patch: Partial<Pick<LocationMapEdgeAuthoringEntry, 'label'>>,
  ) => void;
  /** Debounced persistable fields (e.g. region description) register flush here for Save / boundaries. */
  debouncedPersistableFlushRef?: MutableRefObject<(() => void) | null>;
  /** Switch to region paint for this region; Selection rail stays focused. */
  onBeginRegionPaintFromSelection?: (regionId: string) => void;
};

/**
 * Right-rail **Selection** tab: inspector for the current map selection.
 */
export function SelectionTab({
  selection,
  cellPanelProps,
  stairWorkspaceInspect,
  stairPairingContext,
  pathEntries,
  edgeEntries,
  regionEntries,
  onUpdateRegionEntry,
  onRemovePlacedObjectFromMap,
  onRemovePathFromMap,
  onRemoveEdgeFromMap,
  onRemoveEdgeRunFromMap,
  onRemoveRegionFromMap,
  onPatchEdgeEntry,
  debouncedPersistableFlushRef,
  onBeginRegionPaintFromSelection,
}: SelectionTabProps) {
  switch (selection.type) {
    case 'none':
      return (
        <Typography variant="body2" color="text.secondary">
          Select a cell, region, path, edge, or object on the map.
        </Typography>
      );
    case 'cell':
      return (
        <CellSelectionInspector {...cellPanelProps} selectedCellId={selection.cellId} />
      );
    case 'region': {
      const region = regionEntries.find((r) => r.id === selection.regionId);
      if (!region) {
        return (
          <Typography variant="body2" color="text.secondary">
            Region not found. It may have been removed.
          </Typography>
        );
      }
      return (
        <LocationMapRegionMetadataForm
          region={region}
          formId="location-map-region-metadata-selection"
          onPatchRegion={(regionId, patch) => onUpdateRegionEntry(regionId, patch)}
          debouncedPersistableFlushRef={debouncedPersistableFlushRef}
          onEditRegionSpatially={
            onBeginRegionPaintFromSelection
              ? () => onBeginRegionPaintFromSelection(selection.regionId)
              : undefined
          }
          onRemoveFromMap={
            onRemoveRegionFromMap
              ? () => {
                  debouncedPersistableFlushRef?.current?.();
                  onRemoveRegionFromMap(selection.regionId);
                }
              : undefined
          }
        />
      );
    }
    case 'path':
      return (
        <LocationMapPathInspector
          pathId={selection.pathId}
          pathEntries={pathEntries}
          onRemovePathFromMap={onRemovePathFromMap}
        />
      );
    case 'object':
      return (
        <LocationMapObjectInspector
          cellId={selection.cellId}
          objectId={selection.objectId}
          objectsByCellId={cellPanelProps.objectsByCellId}
          onUpdateCellObjects={cellPanelProps.onUpdateCellObjects}
          onRemovePlacedObjectFromMap={onRemovePlacedObjectFromMap}
          hostScale={cellPanelProps.hostScale}
          campaignId={cellPanelProps.campaignId}
          mapHostLocationId={cellPanelProps.hostLocationId ?? ''}
          mapHostScale={cellPanelProps.hostScale}
          hostEditLocation={cellPanelProps.hostEditLocation ?? null}
          onUpdateLinkedLocation={cellPanelProps.onUpdateLinkedLocation}
          locations={cellPanelProps.locations}
          linkedLocationByCellId={cellPanelProps.linkedLocationByCellId}
          stairWorkspaceInspect={stairWorkspaceInspect}
          stairPairingContext={stairPairingContext}
        />
      );
    case 'edge':
      return (
        <LocationMapEdgeInspector
          edgeId={selection.edgeId}
          edgeEntries={edgeEntries}
          onRemoveEdgeFromMap={onRemoveEdgeFromMap}
          onPatchEdgeEntry={onPatchEdgeEntry}
        />
      );
    case 'edge-run':
      return (
        <LocationMapEdgeRunInspector
          kind={selection.kind}
          edgeIds={selection.edgeIds}
          axis={selection.axis}
          anchorEdgeId={selection.anchorEdgeId}
          edgeEntries={edgeEntries}
          onRemoveEdgeRunFromMap={onRemoveEdgeRunFromMap}
          onPatchEdgeEntry={onPatchEdgeEntry}
        />
      );
  }
}
