import type { LocationMapEditorMode } from '@/features/content/locations/domain/mapEditor';
import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

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
  /** Legacy / internal; Select mode on square grids uses `edge-run` instead. */
  | { type: 'edge'; edgeId: string }
  /**
   * Square grid only: contiguous same-kind straight run along one boundary line.
   * Not used for hex maps (no edge-run grouping there).
   */
  | {
      type: 'edge-run';
      kind: LocationMapEdgeKindId;
      edgeIds: string[];
      axis: 'horizontal' | 'vertical';
      anchorEdgeId: string;
    }
  /** Authored region; derived from cell `regionId` in Select mode when no higher-priority hit. */
  | { type: 'region'; regionId: string };

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
