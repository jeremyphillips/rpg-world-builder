import type { LocationMapEditorMode } from '@/features/content/locations/domain/mapEditor/locationMapEditor.types';

/** Which section of the location editor right rail is visible. Kept separate from toolbar `LocationMapEditorMode`. */
export type LocationEditorRailSection = 'location' | 'map' | 'selection';

/**
 * Inspector selection for map-authored entities. This slice only derives `none` | `cell`
 * from `gridDraft.selectedCellId`; other variants are structural placeholders for future slices.
 */
export type LocationMapSelection =
  | { type: 'none' }
  | { type: 'cell'; cellId: string }
  | { type: 'region'; regionId: string }
  | { type: 'path'; pathId: string }
  | { type: 'object'; cellId: string; objectId: string };

export function deriveLocationMapSelection(
  selectedCellId: string | null,
): LocationMapSelection {
  if (selectedCellId == null || selectedCellId.trim() === '') {
    return { type: 'none' };
  }
  return { type: 'cell', cellId: selectedCellId };
}

/** Event-driven auto-switch: opening Place mode should focus the Map rail section (place palette). */
export function shouldAutoSwitchRailToMapForMode(mode: LocationMapEditorMode): boolean {
  return mode === 'place';
}
