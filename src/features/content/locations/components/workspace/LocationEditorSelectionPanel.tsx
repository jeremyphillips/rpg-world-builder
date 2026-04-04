import Typography from '@mui/material/Typography';

import type { LocationMapEdgeAuthoringEntry, LocationMapPathAuthoringEntry } from '@/shared/domain/locations';
import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';

import type { LocationMapSelection } from './locationEditorRail.types';
import {
  LocationMapEdgeInspector,
  LocationMapEdgeRunInspector,
  LocationMapObjectInspector,
  LocationMapPathInspector,
} from './LocationMapSelectionInspectors';
import {
  LocationCellAuthoringPanel,
  type LocationCellAuthoringPanelProps,
} from '../LocationCellAuthoringPanel';
import { LocationMapRegionMetadataForm } from './LocationMapRegionMetadataForm';
import type { RegionMetadataFormValues } from './LocationMapRegionMetadataForm';

export type LocationEditorSelectionPanelProps = {
  selection: LocationMapSelection;
  /** Passed through for `cell` (same props the route already used for the cell inspector). */
  cellPanelProps: LocationCellAuthoringPanelProps;
  pathEntries: readonly LocationMapPathAuthoringEntry[];
  edgeEntries: readonly LocationMapEdgeAuthoringEntry[];
  regionEntries: readonly LocationMapRegionAuthoringEntry[];
  onUpdateRegionEntry: (
    regionId: string,
    patch: Pick<LocationMapRegionAuthoringEntry, 'name' | 'description' | 'colorKey'>,
  ) => void;
  /** Uses erase/delete draft path (same as Erase on that object); clears map selection when it matches. */
  onRemovePlacedObjectFromMap?: (cellId: string, objectId: string) => void;
  /** Removes the whole path chain (same as Delete when a path is selected). */
  onRemovePathFromMap?: (pathId: string) => void;
  /** Single boundary edge (same as Erase / Delete for that edge). */
  onRemoveEdgeFromMap?: (edgeId: string) => void;
  /** All segments in the selected straight run (same as Delete for edge-run). */
  onRemoveEdgeRunFromMap?: (edgeIds: readonly string[]) => void;
};

/**
 * Right-rail **Selection** section: inspector for the current map selection.
 */
export function LocationEditorSelectionPanel({
  selection,
  cellPanelProps,
  pathEntries,
  edgeEntries,
  regionEntries,
  onUpdateRegionEntry,
  onRemovePlacedObjectFromMap,
  onRemovePathFromMap,
  onRemoveEdgeFromMap,
  onRemoveEdgeRunFromMap,
}: LocationEditorSelectionPanelProps) {
  switch (selection.type) {
    case 'none':
      return (
        <Typography variant="body2" color="text.secondary">
          Select a cell, region, path, edge, or object on the map.
        </Typography>
      );
    case 'cell':
      return (
        <LocationCellAuthoringPanel {...cellPanelProps} selectedCellId={selection.cellId} />
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
          submitLabel="Save"
          onSubmitValues={(values: RegionMetadataFormValues) => {
            onUpdateRegionEntry(region.id, {
              name: values.name,
              description: values.description.trim() === '' ? undefined : values.description.trim(),
              colorKey: values.colorKey,
            });
          }}
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
        />
      );
    case 'edge':
      return (
        <LocationMapEdgeInspector
          edgeId={selection.edgeId}
          edgeEntries={edgeEntries}
          onRemoveEdgeFromMap={onRemoveEdgeFromMap}
        />
      );
    case 'edge-run':
      return (
        <LocationMapEdgeRunInspector
          kind={selection.kind}
          edgeIds={selection.edgeIds}
          axis={selection.axis}
          anchorEdgeId={selection.anchorEdgeId}
          onRemoveEdgeRunFromMap={onRemoveEdgeRunFromMap}
        />
      );
  }
}
