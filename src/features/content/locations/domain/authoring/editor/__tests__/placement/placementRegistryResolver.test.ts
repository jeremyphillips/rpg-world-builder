// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  resolvePlacementCellClick,
  resolvePlacementEdgeFeatureKind,
} from '../../placement/placementRegistryResolver';

describe('placementRegistryResolver', () => {
  it('resolves linked-content city on world to marker object (link chosen in Selection rail)', () => {
    const r = resolvePlacementCellClick(
      { category: 'linked-content', kind: 'city', variantId: 'default' },
      'c-0-0',
      'world',
    );
    expect(r.kind).toBe('append-object');
    if (r.kind === 'append-object') {
      expect(r.cellId).toBe('c-0-0');
      expect(r.objectDraft.kind).toBe('marker');
      expect(r.objectDraft.authoredPlaceKindId).toBe('city');
      expect(r.objectDraft.variantId).toBe('default');
    }
  });

  it('resolves floor table to append-object with payload', () => {
    const r = resolvePlacementCellClick(
      { category: 'map-object', kind: 'table', variantId: 'rect_wood' },
      'c-1-1',
      'floor',
    );
    expect(r.kind).toBe('append-object');
    if (r.kind === 'append-object') {
      expect(r.cellId).toBe('c-1-1');
      expect(r.objectDraft.kind).toBe('table');
      expect(r.objectDraft.authoredPlaceKindId).toBe('table');
      expect(r.objectDraft.variantId).toBe('rect_wood');
    }
  });

  it('non-default table variant still maps to same wire payload (Phase 2 resolver-only variants)', () => {
    const r = resolvePlacementCellClick(
      { category: 'map-object', kind: 'table', variantId: 'circle_wood' },
      'c-1-1',
      'floor',
    );
    expect(r.kind).toBe('append-object');
    if (r.kind === 'append-object') {
      expect(r.objectDraft.kind).toBe('table');
      expect(r.objectDraft.authoredPlaceKindId).toBe('table');
      expect(r.objectDraft.variantId).toBe('circle_wood');
    }
  });

  it('seeds stairEndpoint for stairs on floor', () => {
    const r = resolvePlacementCellClick(
      { category: 'map-object', kind: 'stairs', variantId: 'straight' },
      'c-2-2',
      'floor',
    );
    expect(r.kind).toBe('append-object');
    if (r.kind === 'append-object') {
      expect(r.objectDraft.kind).toBe('stairs');
      expect(r.objectDraft.variantId).toBe('straight');
      expect(r.objectDraft.stairEndpoint?.direction).toBe('both');
    }
  });

  it('resolves linked-content building on world to marker with authoredPlaceKindId (link in Selection rail)', () => {
    const r = resolvePlacementCellClick(
      { category: 'linked-content', kind: 'building', variantId: 'residential' },
      'c-0-1',
      'world',
    );
    expect(r.kind).toBe('append-object');
    if (r.kind === 'append-object') {
      expect(r.objectDraft.kind).toBe('marker');
      expect(r.objectDraft.authoredPlaceKindId).toBe('building');
      expect(r.objectDraft.variantId).toBe('residential');
    }
  });

  it('resolves map-object door on floor to edge feature kind (Place tool)', () => {
    const k = resolvePlacementEdgeFeatureKind(
      { category: 'map-object', kind: 'door', variantId: 'single_wood' },
      'floor',
    );
    expect(k).toBe('door');
  });

  it('resolves map-object window on floor to edge feature kind', () => {
    expect(
      resolvePlacementEdgeFeatureKind(
        { category: 'map-object', kind: 'window', variantId: 'glass' },
        'floor',
      ),
    ).toBe('window');
  });

  it('cell click placement is unsupported for edge families (edges use boundary targeting)', () => {
    const r = resolvePlacementCellClick(
      { category: 'map-object', kind: 'door', variantId: 'single_wood' },
      'c-0-0',
      'floor',
    );
    expect(r.kind).toBe('unsupported');
  });

  it('stairs spiral variant still appends stairs object with stairEndpoint', () => {
    const r = resolvePlacementCellClick(
      { category: 'map-object', kind: 'stairs', variantId: 'spiral' },
      'c-2-2',
      'floor',
    );
    expect(r.kind).toBe('append-object');
    if (r.kind === 'append-object') {
      expect(r.objectDraft.kind).toBe('stairs');
      expect(r.objectDraft.variantId).toBe('spiral');
      expect(r.objectDraft.stairEndpoint?.direction).toBe('both');
    }
  });
});
