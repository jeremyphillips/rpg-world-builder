import { SelectionTab, selectedCellIdForMapSelection } from '@/features/content/locations/components';
import type { SelectionTabProps } from '@/features/content/locations/components/workspace/rightRail/tabs/selection/SelectionTab';
import type { CellSelectionInspectorProps } from '@/features/content/locations/components/workspace/rightRail/tabs/selection/inspectors/CellSelectionInspector';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

export type LocationEditWorkspaceSelectionRailPanelProps = Omit<
  SelectionTabProps,
  'selection' | 'cellPanelProps' | 'pathEntries' | 'edgeEntries' | 'regionEntries'
> & {
  gridDraft: LocationGridDraftState;
  mapHostLocationId: string;
  mapHostScale: string;
  mapHostName: string;
  campaignId?: string;
  hostEditLocation: LocationContentItem | null;
  locations: CellSelectionInspectorProps['locations'];
  onUpdateLinkedLocation: NonNullable<CellSelectionInspectorProps['onUpdateLinkedLocation']>;
  onUpdateCellObjects: NonNullable<CellSelectionInspectorProps['onUpdateCellObjects']>;
};

/**
 * Right-rail **Selection** tab: wraps {@link SelectionTab} with `gridDraft`-derived fields and cell panel props
 * assembled in one place.
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
    <SelectionTab
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
