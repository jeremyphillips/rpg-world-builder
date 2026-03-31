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

  const setModeWithReset = useCallback((next: LocationMapEditorMode) => {
    setMode(next);
    if (next !== 'place') setActivePlace(null);
    if (next !== 'paint') setActivePaint(null);
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
  };
}
