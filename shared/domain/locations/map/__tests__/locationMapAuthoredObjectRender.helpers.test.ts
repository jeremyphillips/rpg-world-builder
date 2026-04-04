import { describe, expect, it } from 'vitest';

import {
  deriveLocationMapAuthoredObjectRenderItems,
  deriveLocationMapAuthoredObjectRenderItemsFromObjectsByCellId,
} from '../locationMapAuthoredObjectRender.helpers';
import type { LocationMapBase } from '../locationMap.types';

describe('deriveLocationMapAuthoredObjectRenderItems', () => {
  it('flattens cellEntries objects with author and combat cell ids', () => {
    const map: LocationMapBase = {
      id: 'm1',
      locationId: 'loc',
      name: 'Test',
      kind: 'encounter-grid',
      grid: { width: 2, height: 2, cellUnit: '5ft' },
      cellEntries: [
        {
          cellId: '0,0',
          objects: [
            { id: 'o1', kind: 'stairs', label: 'Up' },
            { id: 'o2', kind: 'table', authoredPlaceKindId: 'table' },
          ],
        },
        { cellId: '1,0', objects: [{ id: 'o3', kind: 'treasure' }] },
      ],
      pathEntries: [],
      edgeEntries: [],
      regionEntries: [],
    };
    const items = deriveLocationMapAuthoredObjectRenderItems(map);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      id: 'o1',
      authorCellId: '0,0',
      combatCellId: 'c-0-0',
      kind: 'stairs',
      label: 'Up',
    });
    expect(items[1]).toMatchObject({
      id: 'o2',
      authorCellId: '0,0',
      combatCellId: 'c-0-0',
      kind: 'table',
      authoredPlaceKindId: 'table',
    });
    expect(items[2]).toMatchObject({
      id: 'o3',
      authorCellId: '1,0',
      combatCellId: 'c-1-0',
      kind: 'treasure',
    });
  });

  it('returns empty when no objects', () => {
    const map: LocationMapBase = {
      id: 'm1',
      locationId: 'loc',
      name: 'Test',
      kind: 'encounter-grid',
      grid: { width: 1, height: 1, cellUnit: '5ft' },
      cellEntries: [{ cellId: '0,0' }],
      pathEntries: [],
      edgeEntries: [],
      regionEntries: [],
    };
    expect(deriveLocationMapAuthoredObjectRenderItems(map)).toEqual([]);
  });
});

describe('deriveLocationMapAuthoredObjectRenderItemsFromObjectsByCellId', () => {
  it('matches derive output for same object data', () => {
    const map: LocationMapBase = {
      id: 'm1',
      locationId: 'loc',
      name: 'Test',
      kind: 'encounter-grid',
      grid: { width: 2, height: 2, cellUnit: '5ft' },
      cellEntries: [
        { cellId: '0,0', objects: [{ id: 'a', kind: 'door' }] },
        { cellId: '1,1', objects: [{ id: 'b', kind: 'table' }] },
      ],
      pathEntries: [],
      edgeEntries: [],
      regionEntries: [],
    };
    const fromMap = deriveLocationMapAuthoredObjectRenderItems(map);
    const fromDraft = deriveLocationMapAuthoredObjectRenderItemsFromObjectsByCellId({
      '0,0': [{ id: 'a', kind: 'door' }],
      '1,1': [{ id: 'b', kind: 'table' }],
    });
    expect(fromDraft).toEqual(fromMap);
  });
});
