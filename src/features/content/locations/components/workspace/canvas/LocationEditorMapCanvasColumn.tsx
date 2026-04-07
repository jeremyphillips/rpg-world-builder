import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapActivePlaceSelection,
  LocationMapEditorMode,
  LocationMapPaintState,
  MapDrawPaletteItem,
  MapPaintPaletteSection,
  MapPlacePaletteItem,
} from '@/features/content/locations/domain/authoring/editor';
import type { ZoomControlProps } from '@/ui/patterns';
import type { CanvasPoint, UseCanvasPanReturn } from '@/ui/hooks';

import { LocationEditorCanvas } from './LocationEditorCanvas';
import {
  LocationMapEditorDrawTray,
  LocationMapEditorPaintTray,
  LocationMapEditorPlaceTray,
  LocationMapEditorToolTrayShell,
  LocationMapEditorToolbar,
} from '@/features/content/locations/components/workspace/leftTools';

export type LocationEditorMapCanvasColumnProps = {
  showMapEditorChrome: boolean;
  mode: LocationMapEditorMode;
  activePaint: LocationMapActivePaintSelection;
  activeDraw: LocationMapActiveDrawSelection;
  activePlace: LocationMapActivePlaceSelection;
  paintPaletteSections: MapPaintPaletteSection[];
  drawPaletteItems: MapDrawPaletteItem[];
  placePaletteItems: MapPlacePaletteItem[];
  onPaintChange: (next: LocationMapPaintState) => void;
  onModeChange: (mode: LocationMapEditorMode) => void;
  onSelectDraw: (next: LocationMapActiveDrawSelection) => void;
  onSelectPlace: (next: LocationMapActivePlaceSelection) => void;
  zoom: number;
  pan: CanvasPoint;
  panHandlers: UseCanvasPanReturn['pointerHandlers'];
  isDragging: boolean;
  wheelContainerRef: (node: HTMLElement | null) => void;
  zoomControlProps: ZoomControlProps;
  children: ReactNode;
};

/**
 * Shared map toolbar + optional paint/draw trays + zoom/pan canvas column for location edit routes.
 * Left tool chrome overlays the map column so opening trays does not shift the canvas layout.
 */
export function LocationEditorMapCanvasColumn({
  showMapEditorChrome,
  mode,
  activePaint,
  activeDraw,
  activePlace,
  paintPaletteSections,
  drawPaletteItems,
  placePaletteItems,
  onPaintChange,
  onModeChange,
  onSelectDraw,
  onSelectPlace,
  zoom,
  pan,
  panHandlers,
  isDragging,
  wheelContainerRef,
  zoomControlProps,
  children,
}: LocationEditorMapCanvasColumnProps) {
  const showPaintTray = mode === 'paint' && activePaint && paintPaletteSections.length > 0;
  const showDrawTray = mode === 'draw' && drawPaletteItems.length > 0;
  const showPlaceTray = mode === 'place' && placePaletteItems.length > 0;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {showMapEditorChrome && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            pointerEvents: 'none',
          }}
        >
          <Box sx={{ pointerEvents: 'auto', height: '100%' }}>
            <LocationMapEditorToolbar mode={mode} onModeChange={onModeChange} />
          </Box>
          {showPaintTray && (
            <LocationMapEditorToolTrayShell>
              <LocationMapEditorPaintTray
                sections={paintPaletteSections}
                activePaint={activePaint}
                onPaintChange={onPaintChange}
              />
            </LocationMapEditorToolTrayShell>
          )}
          {showDrawTray && (
            <LocationMapEditorToolTrayShell>
              <LocationMapEditorDrawTray
                items={drawPaletteItems}
                activeDraw={activeDraw}
                onSelectDraw={onSelectDraw}
              />
            </LocationMapEditorToolTrayShell>
          )}
          {showPlaceTray && (
            <LocationMapEditorToolTrayShell>
              <LocationMapEditorPlaceTray
                items={placePaletteItems}
                activePlace={activePlace}
                onSelectPlace={onSelectPlace}
              />
            </LocationMapEditorToolTrayShell>
          )}
        </Box>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
        <LocationEditorCanvas
          zoom={zoom}
          pan={pan}
          panHandlers={panHandlers}
          isDragging={isDragging}
          panCursor={mode === 'select' ? 'default' : 'grab'}
          wheelContainerRef={wheelContainerRef}
          zoomControlProps={zoomControlProps}
        >
          {children}
        </LocationEditorCanvas>
      </Box>
    </Box>
  );
}
