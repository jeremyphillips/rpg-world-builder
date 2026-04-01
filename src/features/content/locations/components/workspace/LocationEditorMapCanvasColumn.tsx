import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapEditorMode,
  LocationMapPaintState,
  MapDrawPaletteItem,
  MapPaintPaletteItem,
} from '@/features/content/locations/domain/mapEditor';
import type { ZoomControlProps } from '@/ui/patterns';
import type { CanvasPoint, UseCanvasPanReturn } from '@/ui/hooks';

import { LocationEditorCanvas } from './LocationEditorCanvas';
import {
  LocationMapEditorDrawTray,
  LocationMapEditorPaintTray,
  LocationMapEditorToolbar,
} from '@/features/content/locations/components/mapEditor';

export type LocationEditorMapCanvasColumnProps = {
  showMapEditorChrome: boolean;
  mode: LocationMapEditorMode;
  activePaint: LocationMapActivePaintSelection;
  activeDraw: LocationMapActiveDrawSelection;
  paintPaletteItems: MapPaintPaletteItem[];
  drawPaletteItems: MapDrawPaletteItem[];
  onPaintChange: (next: LocationMapPaintState) => void;
  onModeChange: (mode: LocationMapEditorMode) => void;
  onSelectDraw: (next: LocationMapActiveDrawSelection) => void;
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
 */
export function LocationEditorMapCanvasColumn({
  showMapEditorChrome,
  mode,
  activePaint,
  activeDraw,
  paintPaletteItems,
  drawPaletteItems,
  onPaintChange,
  onModeChange,
  onSelectDraw,
  zoom,
  pan,
  panHandlers,
  isDragging,
  wheelContainerRef,
  zoomControlProps,
  children,
}: LocationEditorMapCanvasColumnProps) {
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
        <>
          <LocationMapEditorToolbar mode={mode} onModeChange={onModeChange} />
          {mode === 'paint' && activePaint && (
            <LocationMapEditorPaintTray
              items={paintPaletteItems}
              activePaint={activePaint}
              onPaintChange={onPaintChange}
            />
          )}
          {mode === 'draw' && (
            <LocationMapEditorDrawTray
              items={drawPaletteItems}
              activeDraw={activeDraw}
              onSelectDraw={onSelectDraw}
            />
          )}
        </>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
        <LocationEditorCanvas
          zoom={zoom}
          pan={pan}
          panHandlers={panHandlers}
          isDragging={isDragging}
          wheelContainerRef={wheelContainerRef}
          zoomControlProps={zoomControlProps}
        >
          {children}
        </LocationEditorCanvas>
      </Box>
    </Box>
  );
}
