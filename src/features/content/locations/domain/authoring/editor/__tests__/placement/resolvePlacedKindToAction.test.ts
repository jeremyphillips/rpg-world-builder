// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { resolvePlacedKindToAction } from '../../placement';

describe('resolvePlacedKindToAction', () => {
  it('returns unsupported without selection', () => {
    expect(resolvePlacedKindToAction(null, 'city')).toEqual({
      type: 'unsupported',
      reason: 'no_selection',
    });
  });

  it('linked-content city on world maps to marker with authoredPlaceKindId city', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'linked-content', kind: 'city', variantId: 'default' },
        'world',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'marker',
      authoredPlaceKindId: 'city',
    });
  });

  it('linked-content city on city maps to marker with authoredPlaceKindId city', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'linked-content', kind: 'city', variantId: 'default' },
        'city',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'marker',
      authoredPlaceKindId: 'city',
    });
  });

  it('linked-content site on city maps to marker with authoredPlaceKindId site', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'linked-content', kind: 'site', variantId: 'default' },
        'city',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'marker',
      authoredPlaceKindId: 'site',
    });
  });

  it('map-object tree on city maps to marker with authoredPlaceKindId tree', () => {
    expect(
      resolvePlacedKindToAction({ category: 'map-object', kind: 'tree', variantId: 'deciduous' }, 'city'),
    ).toEqual({
      type: 'object',
      objectKind: 'marker',
      authoredPlaceKindId: 'tree',
    });
  });

  it('map-object building on city maps to marker with authoredPlaceKindId building', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'map-object', kind: 'building', variantId: 'residential' },
        'city',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'marker',
      authoredPlaceKindId: 'building',
    });
  });

  it('map-object stairs on floor maps to stairs with authoredPlaceKindId', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'map-object', kind: 'stairs', variantId: 'straight' },
        'floor',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'stairs',
      authoredPlaceKindId: 'stairs',
    });
  });

  it('map-object treasure on floor maps to treasure with authoredPlaceKindId', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'map-object', kind: 'treasure', variantId: 'chest' },
        'floor',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'treasure',
      authoredPlaceKindId: 'treasure',
    });
  });

  it('map-object table on floor maps to table with authoredPlaceKindId', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'map-object', kind: 'table', variantId: 'rect_wood' },
        'floor',
      ),
    ).toEqual({
      type: 'object',
      objectKind: 'table',
      authoredPlaceKindId: 'table',
    });
  });

  it('map-object door on floor maps to edge with authored registry identity', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'map-object', kind: 'door', variantId: 'double_wood' },
        'floor',
      ),
    ).toEqual({
      type: 'edge',
      edgeKind: 'door',
      placedKind: 'door',
      variantId: 'double_wood',
    });
  });
});
