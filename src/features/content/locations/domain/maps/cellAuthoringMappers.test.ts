// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { cellDraftToCellEntries, cellEntriesToDraft } from './cellAuthoringMappers';

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

  it('omits draft when no link, objects, or fill', () => {
    expect(cellDraftToCellEntries({}, {}, {})).toEqual([]);
  });
});
