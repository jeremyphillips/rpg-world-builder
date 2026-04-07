import { describe, expect, it } from 'vitest';

import { resolveAuthoredEdgeInstance } from '../locationMapEdgeAuthoring.resolve';

describe('resolveAuthoredEdgeInstance', () => {
  it('resolves enriched row to persisted variant presentation', () => {
    const r = resolveAuthoredEdgeInstance({
      edgeId: 'between:0,0|1,0',
      kind: 'door',
      authoredPlaceKindId: 'door',
      variantId: 'double_wood',
    });
    expect(r.placedKind).toBe('door');
    expect(r.variantId).toBe('double_wood');
    expect(r.objectTitle).toBe('Double Door');
    expect(r.legacyIdentityFallback).toBe(false);
    expect(r.presentation?.form).toBe('double-leaf');
  });

  it('falls back from legacy coarse door row', () => {
    const r = resolveAuthoredEdgeInstance({
      edgeId: 'between:0,0|1,0',
      kind: 'door',
    });
    expect(r.placedKind).toBe('door');
    expect(r.legacyIdentityFallback).toBe(true);
    expect(r.variantId).toBe('single_wood');
    expect(r.presentation?.material).toBe('wood');
  });

  it('resolves wall without placed kind', () => {
    const r = resolveAuthoredEdgeInstance({
      edgeId: 'between:0,0|1,0',
      kind: 'wall',
    });
    expect(r.placedKind).toBeNull();
    expect(r.objectTitle).toBe('Wall');
    expect(r.presentation).toBeUndefined();
  });
});
