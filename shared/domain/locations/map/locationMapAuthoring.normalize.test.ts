import { describe, expect, it } from 'vitest';

import { normalizeLocationMapAuthoringFields, normalizeLocationMapBaseAuthoring } from './locationMapAuthoring.normalize';
import type { LocationMapBase } from './locationMap.types';

describe('normalizeLocationMapAuthoringFields', () => {
  it('fills omitted arrays with empty arrays', () => {
    expect(
      normalizeLocationMapAuthoringFields({
        cellEntries: undefined,
        pathEntries: undefined,
        edgeEntries: undefined,
      }),
    ).toEqual({ cellEntries: [], pathEntries: [], edgeEntries: [], regionEntries: [] });
  });

  it('preserves non-array fields when present', () => {
    const cellEntries = [{ cellId: '0,0', linkedLocationId: 'x' }];
    const pathEntries = [{ id: 'p', kind: 'road' as const, cellIds: ['0,0'] }];
    const edgeEntries = [{ edgeId: 'between:0,0|1,0', kind: 'wall' as const }];
    const regionEntries = [{ id: 'r1', colorKey: 'regionRed' as const, label: 'A' }];
    expect(
      normalizeLocationMapAuthoringFields({ cellEntries, pathEntries, edgeEntries, regionEntries }),
    ).toEqual({
      cellEntries,
      pathEntries,
      edgeEntries,
      regionEntries: [{ id: 'r1', colorKey: 'regionRed', name: 'A' }],
    });
  });
});

describe('normalizeLocationMapBaseAuthoring', () => {
  it('merges normalized authoring onto the map', () => {
    const map = {
      id: 'm1',
      locationId: 'loc',
      name: 'Map',
      kind: 'area' as const,
      grid: { width: 2, height: 2, cellUnit: 'mile' },
      pathEntries: [],
      edgeEntries: [],
      regionEntries: [],
    } as LocationMapBase;
    const sparse = { ...map, cellEntries: undefined, pathEntries: undefined, edgeEntries: undefined, regionEntries: undefined };
    const out = normalizeLocationMapBaseAuthoring(sparse as LocationMapBase);
    expect(out.cellEntries).toEqual([]);
    expect(out.pathEntries).toEqual([]);
    expect(out.edgeEntries).toEqual([]);
    expect(out.regionEntries).toEqual([]);
    expect(out.id).toBe('m1');
  });
});
