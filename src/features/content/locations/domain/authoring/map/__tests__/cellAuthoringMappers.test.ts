// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { cellDraftToCellEntries, cellEntriesToDraft } from '../cellAuthoringMappers';

describe('cellAuthoringMappers', () => {
  it('round-trips cell fill with links and objects', () => {
    const entries = cellDraftToCellEntries(
      { '1,1': 'loc-a' },
      { '2,2': [{ id: 'o1', kind: 'marker' }] },
      { '0,0': 'plains', '1,1': 'water' },
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        cellId: '0,0',
        cellFillKind: 'plains',
      }),
    );
    expect(entries).toContainEqual(
      expect.objectContaining({
        cellId: '1,1',
        linkedLocationId: 'loc-a',
        cellFillKind: 'water',
      }),
    );
    const back = cellEntriesToDraft(entries);
    expect(back.cellFillByCellId['0,0']).toBe('plains');
    expect(back.cellFillByCellId['1,1']).toBe('water');
    expect(back.linkedLocationByCellId['1,1']).toBe('loc-a');
  });

  it('omits draft when no link, objects, fill, or region', () => {
    expect(cellDraftToCellEntries({}, {}, {}, {})).toEqual([]);
  });

  it('round-trips region membership', () => {
    const entries = cellDraftToCellEntries({}, {}, {}, { '0,0': 'reg-1' });
    expect(entries).toEqual([
      { cellId: '0,0', regionId: 'reg-1' },
    ]);
    const back = cellEntriesToDraft(entries);
    expect(back.regionIdByCellId['0,0']).toBe('reg-1');
  });

  it('round-trips object authoredPlaceKindId', () => {
    const entries = cellDraftToCellEntries(
      {},
      { '0,0': [{ id: 'x', kind: 'table', authoredPlaceKindId: 'table' }] },
    );
    expect(entries[0]?.objects?.[0]?.authoredPlaceKindId).toBe('table');
    const back = cellEntriesToDraft(entries);
    expect(back.objectsByCellId['0,0']?.[0]?.authoredPlaceKindId).toBe('table');
  });

  it('round-trips stairs stairEndpoint', () => {
    const entries = cellDraftToCellEntries(
      {},
      {
        '1,1': [
          {
            id: 's1',
            kind: 'stairs',
            authoredPlaceKindId: 'stairs',
            stairEndpoint: {
              direction: 'up',
              targetLocationId: 'floor-b',
              connectionId: 'conn-1',
            },
          },
        ],
      },
    );
    expect(entries[0]?.objects?.[0]?.stairEndpoint?.direction).toBe('up');
    expect(entries[0]?.objects?.[0]?.stairEndpoint?.targetLocationId).toBe('floor-b');
    const back = cellEntriesToDraft(entries);
    expect(back.objectsByCellId['1,1']?.[0]?.stairEndpoint?.direction).toBe('up');
    expect(back.objectsByCellId['1,1']?.[0]?.stairEndpoint?.targetLocationId).toBe('floor-b');
    expect(back.objectsByCellId['1,1']?.[0]?.stairEndpoint?.connectionId).toBe('conn-1');
  });
});
