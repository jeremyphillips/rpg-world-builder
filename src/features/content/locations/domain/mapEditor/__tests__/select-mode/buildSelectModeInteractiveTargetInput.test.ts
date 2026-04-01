import { describe, expect, it } from 'vitest';

import {
  buildSelectModeInteractiveTargetInput,
  buildSelectModeInteractiveTargetInputSkipGeometry,
} from '../../select-mode';

describe('buildSelectModeInteractiveTargetInput', () => {
  const draft = {
    objectsByCellId: { a: [{ id: 'o1' }] },
    linkedLocationByCellId: {},
    regionIdByCellId: {},
    edgeEntries: [{ edgeId: 'e1', kind: 'wall' as const }],
  };

  it('passes through draft fields and geometry', () => {
    const polys = [{ id: 'p1', kind: 'road' as const, points: [] }];
    const geoms = [{ edgeId: 'e1', kind: 'wall' as const, segment: { x1: 0, y1: 0, x2: 1, y2: 0 } }];
    const r = buildSelectModeInteractiveTargetInput(draft, polys, geoms, false);
    expect(r.objectsByCellId).toBe(draft.objectsByCellId);
    expect(r.pathPolys).toBe(polys);
    expect(r.edgeGeoms).toBe(geoms);
    expect(r.edgeEntries).toBe(draft.edgeEntries);
    expect(r.isHex).toBe(false);
    expect(r.skipGeometry).toBeUndefined();
  });

  it('skipGeometry uses empty picks and flag', () => {
    const r = buildSelectModeInteractiveTargetInputSkipGeometry(draft, true);
    expect(r.pathPolys).toEqual([]);
    expect(r.edgeGeoms).toBeNull();
    expect(r.edgeEntries).toEqual([]);
    expect(r.isHex).toBe(true);
    expect(r.skipGeometry).toBe(true);
  });
});
