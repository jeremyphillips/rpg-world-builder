import { describe, expect, it } from 'vitest';

import { INITIAL_LOCATION_GRID_DRAFT } from './locationGridDraft.types';
import { gridDraftPersistableEquals, normalizePersistableCellMaps } from './locationGridDraft.utils';

describe('gridDraftPersistableEquals', () => {
  it('treats empty object label like omitted label (server round-trip)', () => {
    const fromServer = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      objectsByCellId: {
        'cell-0-0': [{ id: 'a', kind: 'marker' as const }],
      },
    };
    const fromUi = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      objectsByCellId: {
        'cell-0-0': [{ id: 'a', kind: 'marker' as const, label: '' }],
      },
    };
    expect(normalizePersistableCellMaps(fromServer)).toEqual(
      normalizePersistableCellMaps(fromUi),
    );
    expect(gridDraftPersistableEquals(fromServer, fromUi)).toBe(true);
  });

  it('is false after removing the last cell object', () => {
    const baseline = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      objectsByCellId: {
        'cell-0-0': [{ id: 'a', kind: 'marker' as const }],
      },
    };
    const afterRemove = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      objectsByCellId: {},
    };
    expect(gridDraftPersistableEquals(baseline, afterRemove)).toBe(false);
  });

  it('compares pathEntries and edgeEntries for persistence equality', () => {
    const a = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['0,0', '1,0'] }],
      edgeEntries: [{ edgeId: 'between:0,0|0,1', kind: 'wall' as const }],
    };
    const b = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['0,0', '1,0'] }],
      edgeEntries: [{ edgeId: 'between:0,0|0,1', kind: 'wall' as const }],
    };
    expect(gridDraftPersistableEquals(a, b)).toBe(true);
  });

  it('detects pathEntries changes', () => {
    const a = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['0,0', '1,0'] }],
    };
    const b = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['0,0', '1,0', '2,0'] }],
    };
    expect(gridDraftPersistableEquals(a, b)).toBe(false);
  });

  it('does not throw when pathEntries or edgeEntries are missing (partial draft)', () => {
    const full = { ...INITIAL_LOCATION_GRID_DRAFT };
    const partial = {
      ...INITIAL_LOCATION_GRID_DRAFT,
      pathEntries: undefined as unknown as typeof full.pathEntries,
      edgeEntries: undefined as unknown as typeof full.edgeEntries,
    };
    expect(() => gridDraftPersistableEquals(full, partial)).not.toThrow();
    expect(gridDraftPersistableEquals(full, partial)).toBe(true);
  });
});
