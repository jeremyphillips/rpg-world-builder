import type { LocationGridDraftState } from '@/features/content/locations/components/authoring/draft/locationGridDraft.types';
import { selectedCellIdForMapSelection } from '@/features/content/locations/components/workspace/rightRail/locationEditorRail.helpers';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/rightRail/types';

/**
 * Centralizes `mapSelection` + `selectedCellId` after successful map authoring so the Selection
 * rail can show the matching inspector. Always derives `selectedCellId` via {@link selectedCellIdForMapSelection}.
 */

export type MapSelectionDraftPatch = Pick<LocationGridDraftState, 'mapSelection' | 'selectedCellId'>;

export function draftPatchForPlacedObject(cellId: string, objectId: string): MapSelectionDraftPatch {
  const mapSelection: LocationMapSelection = { type: 'object', cellId, objectId };
  return {
    mapSelection,
    selectedCellId: selectedCellIdForMapSelection(mapSelection),
  };
}

export function draftPatchForPath(pathId: string): MapSelectionDraftPatch {
  const mapSelection: LocationMapSelection = { type: 'path', pathId };
  return {
    mapSelection,
    selectedCellId: selectedCellIdForMapSelection(mapSelection),
  };
}

/**
 * After an edge stroke, prefer a single canonical edge id for selection (documented fallback until
 * edge-run parity with Select mode is shared here).
 */
export function draftPatchForEdgeStrokeFirstEdge(edgeIds: readonly string[]): MapSelectionDraftPatch | null {
  const edgeId = edgeIds[0]?.trim();
  if (!edgeId) return null;
  const mapSelection: LocationMapSelection = { type: 'edge', edgeId };
  return {
    mapSelection,
    selectedCellId: selectedCellIdForMapSelection(mapSelection),
  };
}

export function draftPatchForLinkedCell(cellId: string): MapSelectionDraftPatch {
  const mapSelection: LocationMapSelection = { type: 'cell', cellId };
  return {
    mapSelection,
    selectedCellId: selectedCellIdForMapSelection(mapSelection),
  };
}
