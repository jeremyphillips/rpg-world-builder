import type { LocationMapEditorMode } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';

/** Which section of the location editor right rail is visible. Kept separate from toolbar `LocationMapEditorMode`. */
export type LocationEditorRailSection = 'location' | 'map' | 'selection';

/**
 * Inspector selection for map-authored entities. Stored on {@link LocationGridDraftState#mapSelection}
 * and updated from Select-mode hit-testing (objects, edges, paths, cells).
 */
export type LocationMapSelection =
  | { type: 'none' }
  | { type: 'cell'; cellId: string }
  | { type: 'object'; cellId: string; objectId: string }
  | { type: 'path'; pathId: string }
  | { type: 'edge'; edgeId: string }
  /** Reserved until region authoring exists. */
  | { type: 'region'; regionId: string };

/** Event-driven auto-switch: opening Place mode should focus the Map rail section (place palette). */
export function shouldAutoSwitchRailToMapForMode(mode: LocationMapEditorMode): boolean {
  return mode === 'place';
}
