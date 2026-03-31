import { useCallback, useState } from 'react';

import type {
  LocationMapActivePaintSelection,
  LocationMapActivePlaceSelection,
  LocationMapEditorMode,
  LocationMapPendingPlacement,
} from './locationMapEditor.types';

export function useLocationMapEditorState() {
  const [mode, setMode] = useState<LocationMapEditorMode>('select');
  const [activePlace, setActivePlace] = useState<LocationMapActivePlaceSelection>(null);
  const [activePaint, setActivePaint] = useState<LocationMapActivePaintSelection>(null);
  const [pendingPlacement, setPendingPlacement] = useState<LocationMapPendingPlacement>(null);
  /** First cell for two-click path segment placement; cleared after each segment or when leaving place mode. */
  const [pathAnchorCellId, setPathAnchorCellId] = useState<string | null>(null);

  const setModeWithReset = useCallback((next: LocationMapEditorMode) => {
    setMode(next);
    if (next !== 'place') {
      setActivePlace(null);
      setPathAnchorCellId(null);
      setPendingPlacement(null);
    }
    if (next !== 'paint') {
      setActivePaint(null);
    }
  }, []);

  return {
    mode,
    setMode: setModeWithReset,
    activePlace,
    setActivePlace,
    activePaint,
    setActivePaint,
    pendingPlacement,
    setPendingPlacement,
    pathAnchorCellId,
    setPathAnchorCellId,
  };
}
