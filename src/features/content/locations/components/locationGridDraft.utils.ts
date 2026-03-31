import type { LocationGridDraftState } from './locationGridDraft.types';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const rec = value as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(rec[k])}`).join(',')}}`;
}

/** Compare persisted map fields only (ignores selectedCellId). */
export function gridDraftPersistableEquals(
  a: LocationGridDraftState,
  b: LocationGridDraftState,
): boolean {
  const pa = {
    excludedCellIds: [...a.excludedCellIds].sort(),
    linkedLocationByCellId: a.linkedLocationByCellId,
    objectsByCellId: a.objectsByCellId,
    cellFillByCellId: a.cellFillByCellId,
  };
  const pb = {
    excludedCellIds: [...b.excludedCellIds].sort(),
    linkedLocationByCellId: b.linkedLocationByCellId,
    objectsByCellId: b.objectsByCellId,
    cellFillByCellId: b.cellFillByCellId,
  };
  return (
    stableStringify(pa.excludedCellIds) === stableStringify(pb.excludedCellIds) &&
    stableStringify(pa.linkedLocationByCellId) ===
      stableStringify(pb.linkedLocationByCellId) &&
    stableStringify(pa.objectsByCellId) === stableStringify(pb.objectsByCellId) &&
    stableStringify(pa.cellFillByCellId) === stableStringify(pb.cellFillByCellId)
  );
}
