import {
  LocationEditorSelectionPanel,
  selectedCellIdForMapSelection,
} from '@/features/content/locations/components';
import type { LocationEditorSelectionPanelProps } from '@/features/content/locations/components/workspace/rightRail/selection/LocationEditorSelectionPanel';
import type { LocationCellAuthoringPanelProps } from '@/features/content/locations/components/workspace/rightRail/panels/LocationCellAuthoringPanel';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

export type LocationEditWorkspaceSelectionRailPanelProps = Omit<
  LocationEditorSelectionPanelProps,
  'selection' | 'cellPanelProps' | 'pathEntries' | 'edgeEntries' | 'regionEntries'
> & {
  gridDraft: LocationGridDraftState;
  mapHostLocationId: string;
  mapHostScale: string;
  mapHostName: string;
  campaignId?: string;
  hostEditLocation: LocationContentItem | null;
  locations: LocationCellAuthoringPanelProps['locations'];
  onUpdateLinkedLocation: NonNullable<LocationCellAuthoringPanelProps['onUpdateLinkedLocation']>;
  onUpdateCellObjects: NonNullable<LocationCellAuthoringPanelProps['onUpdateCellObjects']>;
};

/**
 * Right-rail **Selection** tab: wraps {@link LocationEditorSelectionPanel} with `gridDraft`-derived
 * fields and cell panel props assembled in one place.
 */
export function LocationEditWorkspaceSelectionRailPanel({
  gridDraft,
  mapHostLocationId,
  mapHostScale,
  mapHostName,
  campaignId,
  hostEditLocation,
  locations,
  onUpdateLinkedLocation,
  onUpdateCellObjects,
  ...rest
}: LocationEditWorkspaceSelectionRailPanelProps) {
  return (
    <LocationEditorSelectionPanel
      {...rest}
      selection={gridDraft.mapSelection}
      pathEntries={gridDraft.pathEntries}
      edgeEntries={gridDraft.edgeEntries}
      regionEntries={gridDraft.regionEntries}
      cellPanelProps={{
        selectedCellId: selectedCellIdForMapSelection(gridDraft.mapSelection),
        hostLocationId: mapHostLocationId,
        hostScale: mapHostScale,
        hostName: mapHostName,
        campaignId,
        hostEditLocation,
        locations,
        linkedLocationByCellId: gridDraft.linkedLocationByCellId,
        objectsByCellId: gridDraft.objectsByCellId,
        cellFillByCellId: gridDraft.cellFillByCellId,
        onUpdateLinkedLocation,
        onUpdateCellObjects,
      }}
    />
  );
}
