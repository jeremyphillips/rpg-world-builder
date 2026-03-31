import {
  cellDraftToCellEntries,
  cellEntriesToDraft,
} from '@/features/content/locations/domain/maps/cellAuthoringMappers';

import type { LocationGridDraftState } from './locationGridDraft.types';

/** Draft snapshots may omit path/edge arrays (older persisted client state, partial spreads). */
function pathEntriesForCompare(d: LocationGridDraftState) {
  return Array.isArray(d.pathEntries) ? d.pathEntries : [];
}

function edgeEntriesForCompare(d: LocationGridDraftState) {
  return Array.isArray(d.edgeEntries) ? d.edgeEntries : [];
}

function sortPathEntriesForCompare(d: LocationGridDraftState) {
  return [...pathEntriesForCompare(d)].sort((x, y) => x.id.localeCompare(y.id));
}

function sortEdgeEntriesForCompare(d: LocationGridDraftState) {
  return [...edgeEntriesForCompare(d)].sort((x, y) => x.edgeId.localeCompare(y.edgeId));
}

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) as string;
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(rec[k])}`).join(',')}}`;
}

/**
 * Canonical shape for cell-linked maps (matches server round-trip via cellEntries).
 * Aligns UI-only fields (e.g. empty object labels) with persisted payloads.
 */
export function normalizePersistableCellMaps(d: LocationGridDraftState) {
  return cellEntriesToDraft(
    cellDraftToCellEntries(
      d.linkedLocationByCellId,
      d.objectsByCellId,
      d.cellFillByCellId,
    ),
  );
}

/** Compare persisted map fields only (ignores selectedCellId). */
export function gridDraftPersistableEquals(
  a: LocationGridDraftState,
  b: LocationGridDraftState,
): boolean {
  const excludedA = [...a.excludedCellIds].sort();
  const excludedB = [...b.excludedCellIds].sort();
  if (stableStringify(excludedA) !== stableStringify(excludedB)) return false;

  const na = normalizePersistableCellMaps(a);
  const nb = normalizePersistableCellMaps(b);
  if (
    stableStringify(na.linkedLocationByCellId) !==
      stableStringify(nb.linkedLocationByCellId) ||
    stableStringify(na.objectsByCellId) !== stableStringify(nb.objectsByCellId) ||
    stableStringify(na.cellFillByCellId) !== stableStringify(nb.cellFillByCellId)
  ) {
    return false;
  }
  if (
    stableStringify(sortPathEntriesForCompare(a)) !==
    stableStringify(sortPathEntriesForCompare(b))
  ) {
    return false;
  }
  if (
    stableStringify(sortEdgeEntriesForCompare(a)) !==
    stableStringify(sortEdgeEntriesForCompare(b))
  ) {
    return false;
  }
  return true;
}
