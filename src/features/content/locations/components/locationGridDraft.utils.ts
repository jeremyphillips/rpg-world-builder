import { normalizeLocationMapAuthoringFields } from '@/shared/domain/locations';
import { cellDraftToCellEntries, cellEntriesToDraft } from '@/features/content/locations/domain/mapAuthoring/cellAuthoringMappers';

import type { LocationGridDraftState } from './locationGridDraft.types';

/** Deterministic JSON-like string for deep equality (sorted object keys). */
export function stableStringify(value: unknown): string {
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

/** Full authoring payload for save/bootstrap (normalized arrays). */
export function normalizedAuthoringPayloadFromGridDraft(draft: LocationGridDraftState) {
  const cellEntries = cellDraftToCellEntries(
    draft.linkedLocationByCellId,
    draft.objectsByCellId,
    draft.cellFillByCellId,
    draft.regionIdByCellId,
  );
  return normalizeLocationMapAuthoringFields({
    cellEntries,
    pathEntries: draft.pathEntries,
    edgeEntries: draft.edgeEntries,
    regionEntries: draft.regionEntries,
  });
}

/**
 * Map slice used for homebrew dirty snapshot, save/bootstrap, and `gridDraftPersistableEquals`.
 * Sorts path/edge/region arrays by stable ids so ordering-only differences do not dirty or block save.
 */
export function buildPersistableMapPayloadFromGridDraft(gridDraft: LocationGridDraftState): {
  excludedCellIds: string[];
} & ReturnType<typeof normalizedAuthoringPayloadFromGridDraft> {
  const normalized = normalizedAuthoringPayloadFromGridDraft(gridDraft);
  return {
    excludedCellIds: [...gridDraft.excludedCellIds].sort(),
    cellEntries: normalized.cellEntries,
    pathEntries: [...normalized.pathEntries].sort((a, b) => a.id.localeCompare(b.id)),
    edgeEntries: [...normalized.edgeEntries].sort((a, b) => a.edgeId.localeCompare(b.edgeId)),
    regionEntries: [...normalized.regionEntries].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/**
 * Canonical shape for cell-linked maps (matches server round-trip via cellEntries).
 * Aligns UI-only fields (e.g. empty object labels) with persisted payloads.
 */
export function normalizePersistableCellMaps(d: LocationGridDraftState) {
  const cellEntries = cellDraftToCellEntries(
    d.linkedLocationByCellId,
    d.objectsByCellId,
    d.cellFillByCellId,
    d.regionIdByCellId,
  );
  return {
    ...cellEntriesToDraft(cellEntries),
    regionEntries: d.regionEntries,
  };
}

/** Compare persisted map fields only (ignores selectedCellId). Same payload as save + snapshot map slice. */
export function gridDraftPersistableEquals(
  a: LocationGridDraftState,
  b: LocationGridDraftState,
): boolean {
  return (
    stableStringify(buildPersistableMapPayloadFromGridDraft(a)) ===
    stableStringify(buildPersistableMapPayloadFromGridDraft(b))
  );
}
