// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';

import { resolveEraseTargetAtCell } from './resolveEraseTarget';

describe('resolveEraseTargetAtCell', () => {
  const cols = 4;
  const rows = 4;

  it('prefers an edge feature when present on that cell boundary', () => {
    const a = '0,0';
    const b = '1,0';
    const edgeId = makeUndirectedSquareEdgeKey(a, b);
    const draft = {
      pathSegments: [{ id: 'p1', startCellId: a, endCellId: b }],
      edgeFeatures: [{ id: 'e1', edgeId }],
      objectsByCellId: { [a]: [{ id: 'o1' }] },
      linkedLocationByCellId: { [a]: 'loc1' },
    };
    expect(resolveEraseTargetAtCell(a, draft, cols, rows)).toEqual({
      type: 'edge',
      featureId: 'e1',
    });
  });

  it('then object when no edge', () => {
    const cell = '1,1';
    const draft = {
      pathSegments: [],
      edgeFeatures: [],
      objectsByCellId: { [cell]: [{ id: 'o1' }] },
      linkedLocationByCellId: {},
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'object',
      cellId: cell,
      objectId: 'o1',
    });
  });

  it('then path segment when no edge or object', () => {
    const cell = '2,2';
    const draft = {
      pathSegments: [{ id: 'p1', startCellId: '2,1', endCellId: cell }],
      edgeFeatures: [],
      objectsByCellId: {},
      linkedLocationByCellId: {},
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'path',
      segmentId: 'p1',
    });
  });

  it('then link when only link remains', () => {
    const cell = '0,1';
    const draft = {
      pathSegments: [],
      edgeFeatures: [],
      objectsByCellId: {},
      linkedLocationByCellId: { [cell]: 'x' },
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'link',
      cellId: cell,
    });
  });
});
