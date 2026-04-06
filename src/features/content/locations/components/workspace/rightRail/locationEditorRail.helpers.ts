import type { LocationMapEditorMode } from '@/features/content/locations/domain/authoring/editor';

import type { LocationMapSelection } from './types/locationEditorRail.types';

/**
 * Map selection and right-rail chrome helpers. Lives next to {@link ./types/} so `types/` stays
 * type-only; these are small pure functions shared with grid, domain select-mode, and routes.
 */

/**
 * Which cell (if any) should receive grid “selected cell” chrome. Region / path / edge do not
 * highlight a cell; only `cell` and `object` selections do.
 */
export function selectedCellIdForMapSelection(
  selection: LocationMapSelection,
): string | null {
  if (selection.type === 'cell' || selection.type === 'object') {
    return selection.cellId;
  }
  return null;
}

/** Stable equality for hover vs selection state updates. */
export function mapSelectionEqual(a: LocationMapSelection, b: LocationMapSelection): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Event-driven auto-switch: opening Place or Draw mode should focus the Map rail section.
 * Region paint switches the rail to Map when paint domain becomes `region` (see route `handlePaintChange`).
 */
export function shouldAutoSwitchRailToMapForMode(mode: LocationMapEditorMode): boolean {
  return mode === 'place' || mode === 'draw';
}
