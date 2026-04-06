import type { Dispatch, SetStateAction } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/model/map/locationMapRegionColors.types';
import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapActivePlaceSelection,
  LocationMapEditorMode,
} from '@/features/content/locations/domain/authoring/editor';
import type { MapDrawPaletteItem, MapPlacePaletteItem } from '@/features/content/locations/domain/authoring/editor';
import {
  LocationEditorSelectionPanel,
  LocationMapEditorDrawPanel,
  LocationMapEditorPaintMapPanel,
  LocationMapEditorPlacePanel,
  selectedCellIdForMapSelection,
} from '@/features/content/locations/components';
import type { LocationEditorSelectionPanelProps } from '@/features/content/locations/components/workspace/rightRail/selection/LocationEditorSelectionPanel';
import type { LocationCellAuthoringPanelProps } from '@/features/content/locations/components/workspace/rightRail/panels/LocationCellAuthoringPanel';
import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';

/**
 * Right-rail **Map** tab: tool palette and hints. Lives under `routes/locationEdit/` as workspace
 * assembly (route-shaped props), not domain semantics.
 */
export type LocationEditWorkspaceMapAuthoringRailPanelProps = {
  mapEditor: {
    mode: LocationMapEditorMode;
    activePlace: LocationMapActivePlaceSelection;
    setActivePlace: Dispatch<SetStateAction<LocationMapActivePlaceSelection>>;
    activeDraw: LocationMapActiveDrawSelection;
    setActiveDraw: Dispatch<SetStateAction<LocationMapActiveDrawSelection>>;
    activePaint: LocationMapActivePaintSelection;
  };
  placePaletteItems: MapPlacePaletteItem[];
  drawPaletteItems: MapDrawPaletteItem[];
  regionEntries: readonly LocationMapRegionAuthoringEntry[];
  onCreateRegion: () => void;
  onSelectActiveRegion: (regionId: string) => void;
  onActiveRegionColorKeyChange: (colorKey: LocationMapRegionColorKey) => void;
  onEditRegionInSelection: () => void;
};

export function LocationEditWorkspaceMapAuthoringRailPanel({
  mapEditor,
  placePaletteItems,
  drawPaletteItems,
  regionEntries,
  onCreateRegion,
  onSelectActiveRegion,
  onActiveRegionColorKeyChange,
  onEditRegionInSelection,
}: LocationEditWorkspaceMapAuthoringRailPanelProps) {
  return (
    <Stack spacing={2}>
      {mapEditor.mode === 'place' ? (
        <LocationMapEditorPlacePanel
          items={placePaletteItems}
          activePlace={mapEditor.activePlace}
          onSelectPlace={mapEditor.setActivePlace}
        />
      ) : mapEditor.mode === 'draw' ? (
        <LocationMapEditorDrawPanel
          items={drawPaletteItems}
          activeDraw={mapEditor.activeDraw}
          onSelectDraw={mapEditor.setActiveDraw}
        />
      ) : mapEditor.mode === 'paint' && mapEditor.activePaint ? (
        <LocationMapEditorPaintMapPanel
          paint={mapEditor.activePaint}
          regionEntries={regionEntries}
          onCreateRegion={onCreateRegion}
          onSelectActiveRegion={onSelectActiveRegion}
          onActiveRegionColorKeyChange={onActiveRegionColorKeyChange}
          onEditRegionInSelection={onEditRegionInSelection}
        />
      ) : mapEditor.mode === 'erase' ? (
        <Typography variant="body2" color="text.secondary">
          Click a cell to remove the topmost feature (edge, object, path segment, link, or terrain fill). Drag across
          cells to strip terrain fill in bulk.
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Use the toolbar to choose a tool. Open Selection to inspect cells, paths, edges, and runs.
        </Typography>
      )}
    </Stack>
  );
}

export type LocationEditWorkspaceSelectionRailPanelProps = Omit<
  LocationEditorSelectionPanelProps,
  'selection' | 'cellPanelProps' | 'pathEntries' | 'edgeEntries' | 'regionEntries'
> & {
  gridDraft: LocationGridDraftState;
  mapHostLocationId: string;
  mapHostScale: string;
  mapHostName: string;
  campaignId?: string;
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
        locations,
        linkedLocationByCellId: gridDraft.linkedLocationByCellId,
        objectsByCellId: gridDraft.objectsByCellId,
        onUpdateLinkedLocation,
        onUpdateCellObjects,
      }}
    />
  );
}
