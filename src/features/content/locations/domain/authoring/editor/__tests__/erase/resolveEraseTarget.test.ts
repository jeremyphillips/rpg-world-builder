// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { makeUndirectedSquareEdgeKey } from '@/shared/domain/grid/gridEdgeIds';

import { resolveEraseTargetAtCell } from '../../erase';

describe('resolveEraseTargetAtCell', () => {
  const cols = 4;
  const rows = 4;

  it('skipEdgeTargets skips edge priority so hex maps do not silently erase stored edges', () => {
    const a = '0,0';
    const b = '1,0';
    const edgeId = makeUndirectedSquareEdgeKey(a, b);
    const draft = {
      pathEntries: [],
      edgeEntries: [{ edgeId, kind: 'wall' as const }],
      objectsByCellId: { [a]: [{ id: 'o1' }] },
      linkedLocationByCellId: {},
    };
    expect(
      resolveEraseTargetAtCell(a, draft, cols, rows, { skipEdgeTargets: true }),
    ).toEqual({
      type: 'object',
      cellId: a,
      objectId: 'o1',
    });
  });

  it('prefers an edge entry when present on that cell boundary', () => {
    const a = '0,0';
    const b = '1,0';
    const edgeId = makeUndirectedSquareEdgeKey(a, b);
    const draft = {
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: [a, b] }],
      edgeEntries: [{ edgeId, kind: 'wall' as const }],
      objectsByCellId: { [a]: [{ id: 'o1' }] },
      linkedLocationByCellId: { [a]: 'loc1' },
    };
    expect(resolveEraseTargetAtCell(a, draft, cols, rows)).toEqual({
      type: 'edge',
      edgeId,
    });
  });

  it('then object when no edge', () => {
    const cell = '1,1';
    const draft = {
      pathEntries: [],
      edgeEntries: [],
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
      pathEntries: [{ id: 'p1', kind: 'road' as const, cellIds: ['2,1', cell] }],
      edgeEntries: [],
      objectsByCellId: {},
      linkedLocationByCellId: {},
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'path',
      pathId: 'p1',
      neighborCellId: '2,1',
    });
  });

  it('then link when only link remains', () => {
    const cell = '0,1';
    const draft = {
      pathEntries: [],
      edgeEntries: [],
      objectsByCellId: {},
      linkedLocationByCellId: { [cell]: 'x' },
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'link',
      cellId: cell,
    });
  });

  it('then cell fill when higher-priority targets are absent', () => {
    const cell = '1,2';
    const draft = {
      pathEntries: [],
      edgeEntries: [],
      objectsByCellId: {},
      linkedLocationByCellId: {},
      cellFillByCellId: {
        [cell]: { familyId: 'plains' as const, variantId: 'temperate_open' as const },
      },
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'fill',
      cellId: cell,
    });
  });

  it('prefers fill over region when both present', () => {
    const cell = '1,2';
    const draft = {
      pathEntries: [],
      edgeEntries: [],
      objectsByCellId: {},
      linkedLocationByCellId: {},
      cellFillByCellId: {
        [cell]: { familyId: 'plains' as const, variantId: 'temperate_open' as const },
      },
      regionIdByCellId: { [cell]: 'r1' },
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'fill',
      cellId: cell,
    });
  });

  it('then region assignment when no higher-priority content', () => {
    const cell = '1,2';
    const draft = {
      pathEntries: [],
      edgeEntries: [],
      objectsByCellId: {},
      linkedLocationByCellId: {},
      regionIdByCellId: { [cell]: 'r1' },
    };
    expect(resolveEraseTargetAtCell(cell, draft, cols, rows)).toEqual({
      type: 'region',
      cellId: cell,
    });
  });
});
