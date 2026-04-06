import { applyEraseTargetToDraft } from '@/features/content/locations/domain';
import type { LocationGridDraftState } from '@/features/content/locations/components';

/**
 * Map selection delete/removal helpers for the location edit session (route-shaped draft updates).
 * Kept colocated with {@link useLocationEditWorkspaceModel}, not generic domain rules.
 */

/**
 * Remove the current map selection from the draft when it is a deletable entity.
 * Object/edge reuse {@link applyEraseTargetToDraft} (same mutations as Erase tool for those targets).
 * Whole-path removal is Select-only (Erase removes one segment via resolveEraseTargetAtCell).
 */
export function applyRemovePlacedObjectToDraft(
  prev: LocationGridDraftState,
  cellId: string,
  objectId: string,
): LocationGridDraftState {
  const next = applyEraseTargetToDraft(
    prev,
    { type: 'object', cellId, objectId },
    cellId,
    () => crypto.randomUUID(),
  );
  const clearSelection =
    prev.mapSelection.type === 'object' &&
    prev.mapSelection.cellId === cellId &&
    prev.mapSelection.objectId === objectId;
  return clearSelection
    ? { ...next, mapSelection: { type: 'none' }, selectedCellId: null }
    : next;
}

/** Whole-path removal (same as Delete when a path is selected; Erase removes one segment). */
export function applyRemovePathFromDraft(
  prev: LocationGridDraftState,
  pathId: string,
): LocationGridDraftState {
  const next: LocationGridDraftState = {
    ...prev,
    pathEntries: prev.pathEntries.filter((p) => p.id !== pathId),
  };
  const clearSelection =
    prev.mapSelection.type === 'path' && prev.mapSelection.pathId === pathId;
  return clearSelection
    ? { ...next, mapSelection: { type: 'none' }, selectedCellId: null }
    : next;
}

function sameEdgeIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((id) => sb.has(id));
}

/** Single boundary edge removal (same as Erase on that edge / Delete when that edge is selected). */
export function applyRemoveEdgeFromDraft(
  prev: LocationGridDraftState,
  edgeId: string,
): LocationGridDraftState {
  const next = applyEraseTargetToDraft(
    prev,
    { type: 'edge', edgeId },
    '',
    () => crypto.randomUUID(),
  );
  const clearSelection =
    prev.mapSelection.type === 'edge' && prev.mapSelection.edgeId === edgeId;
  return clearSelection
    ? { ...next, mapSelection: { type: 'none' }, selectedCellId: null }
    : next;
}

/** Removes every segment in a straight run (same as Delete when an edge-run is selected). */
export function applyRemoveEdgeRunFromDraft(
  prev: LocationGridDraftState,
  edgeIdsToRemove: readonly string[],
): LocationGridDraftState {
  const remove = new Set(edgeIdsToRemove);
  const next: LocationGridDraftState = {
    ...prev,
    edgeEntries: prev.edgeEntries.filter((ent) => !remove.has(ent.edgeId)),
  };
  const clearSelection =
    prev.mapSelection.type === 'edge-run' &&
    sameEdgeIdSet(prev.mapSelection.edgeIds, edgeIdsToRemove);
  return clearSelection
    ? { ...next, mapSelection: { type: 'none' }, selectedCellId: null }
    : next;
}

export function applyDeleteForMapSelection(prev: LocationGridDraftState): LocationGridDraftState | null {
  const ms = prev.mapSelection;
  if (ms.type === 'object') {
    return applyRemovePlacedObjectToDraft(prev, ms.cellId, ms.objectId);
  }
  if (ms.type === 'path') {
    return applyRemovePathFromDraft(prev, ms.pathId);
  }
  if (ms.type === 'edge') {
    return applyRemoveEdgeFromDraft(prev, ms.edgeId);
  }
  if (ms.type === 'edge-run') {
    return applyRemoveEdgeRunFromDraft(prev, ms.edgeIds);
  }
  return null;
}
