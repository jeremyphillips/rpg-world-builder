import type { LocationMapActiveDrawSelection } from '../types/locationMapEditor.types';
import type { LocationMapSelection } from '@/features/content/locations/components/workspace/locationEditorRail.types';

/**
 * Hex maps do not support square boundary-edge authoring, rendering, or selection (see docs).
 * When geometry is hex, clear edge draw tool and edge selections so users are not stuck on
 * an invisible selection; stored `edgeEntries` remain on the draft for save round-trip.
 */
export function computeHexEdgeConstraintPatch(
  gridGeometry: string | undefined,
  mapSelection: LocationMapSelection,
  activeDraw: LocationMapActiveDrawSelection,
): {
  draftPatch: { mapSelection: LocationMapSelection; selectedCellId: string | null } | null;
  clearActiveDrawEdge: boolean;
} {
  if (gridGeometry !== 'hex') {
    return { draftPatch: null, clearActiveDrawEdge: false };
  }
  const clearActiveDrawEdge = activeDraw?.category === 'edge';
  const edgeSelection =
    mapSelection.type === 'edge' || mapSelection.type === 'edge-run';
  if (!edgeSelection && !clearActiveDrawEdge) {
    return { draftPatch: null, clearActiveDrawEdge: false };
  }
  if (!edgeSelection) {
    return { draftPatch: null, clearActiveDrawEdge };
  }
  return {
    draftPatch: { mapSelection: { type: 'none' }, selectedCellId: null },
    clearActiveDrawEdge,
  };
}
