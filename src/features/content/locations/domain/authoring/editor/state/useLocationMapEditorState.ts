import { useCallback, useState } from 'react';

import type {
  LocationMapActiveDrawSelection,
  LocationMapActivePaintSelection,
  LocationMapActivePlaceSelection,
  LocationMapEditorMode,
} from '../types/locationMapEditor.types';
import { createInitialPaintState } from '../paint/locationMapPaintSelection.helpers';

export function useLocationMapEditorState() {
  const [mode, setMode] = useState<LocationMapEditorMode>('select');
  const [activePlace, setActivePlace] = useState<LocationMapActivePlaceSelection>(null);
  const [activeDraw, setActiveDraw] = useState<LocationMapActiveDrawSelection>(null);
  const [activePaint, setActivePaint] = useState<LocationMapActivePaintSelection>(null);
  /** First cell for two-click path segment placement (Draw → path); cleared when leaving Draw or after segment. */
  const [pathAnchorCellId, setPathAnchorCellId] = useState<string | null>(null);

  const setModeWithReset = useCallback((next: LocationMapEditorMode) => {
    setMode(next);
    if (next !== 'place') {
      setActivePlace(null);
    }
    if (next !== 'draw') {
      setActiveDraw(null);
      setPathAnchorCellId(null);
    }
    if (next === 'paint') {
      setActivePaint(createInitialPaintState());
    } else {
      setActivePaint(null);
    }
  }, []);

  return {
    mode,
    setMode: setModeWithReset,
    activePlace,
    setActivePlace,
    activeDraw,
    setActiveDraw,
    activePaint,
    setActivePaint,
    pathAnchorCellId,
    setPathAnchorCellId,
  };
}
