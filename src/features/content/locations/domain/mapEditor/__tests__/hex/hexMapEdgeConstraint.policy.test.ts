// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { computeHexEdgeConstraintPatch } from '../../hex/hexMapEdgeConstraint.policy';

describe('computeHexEdgeConstraintPatch', () => {
  it('no-op when geometry is not hex', () => {
    const r = computeHexEdgeConstraintPatch(
      'square',
      { type: 'edge', edgeId: 'between:0,0|1,0' },
      { category: 'edge', kind: 'wall' },
    );
    expect(r.draftPatch).toBeNull();
    expect(r.clearActiveDrawEdge).toBe(false);
  });

  it('clears edge draw tool on hex', () => {
    const r = computeHexEdgeConstraintPatch('hex', { type: 'none' }, {
      category: 'edge',
      kind: 'wall',
    });
    expect(r.draftPatch).toBeNull();
    expect(r.clearActiveDrawEdge).toBe(true);
  });

  it('clears edge selection on hex', () => {
    const r = computeHexEdgeConstraintPatch(
      'hex',
      { type: 'edge', edgeId: 'between:0,0|1,0' },
      null,
    );
    expect(r.draftPatch).toEqual({
      mapSelection: { type: 'none' },
      selectedCellId: null,
    });
    expect(r.clearActiveDrawEdge).toBe(false);
  });

  it('clears edge-run selection on hex', () => {
    const r = computeHexEdgeConstraintPatch(
      'hex',
      {
        type: 'edge-run',
        kind: 'wall',
        edgeIds: ['e1'],
        axis: 'horizontal',
        anchorEdgeId: 'e1',
      },
      null,
    );
    expect(r.draftPatch?.mapSelection).toEqual({ type: 'none' });
  });
});
