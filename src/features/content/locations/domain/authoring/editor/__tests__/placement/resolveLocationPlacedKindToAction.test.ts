// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  resolveLocationPlacedKindToAction,
  resolvePlacedKindToAction,
} from '../../placement';

describe('resolvePlacedKindToAction', () => {
  it('returns unsupported without selection', () => {
    expect(resolvePlacedKindToAction(null, 'city')).toEqual({
      type: 'unsupported',
      reason: 'no_selection',
    });
  });

  it('linked-content city on world opens link', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'linked-content', kind: 'city', variantId: 'default' },
        'world',
      ),
    ).toEqual({ type: 'link', objectKind: 'city', linkedScale: 'city' });
  });

  it('linked-content city on city opens link when registry allows city host scale', () => {
    expect(
      resolvePlacedKindToAction(
        { category: 'linked-content', kind: 'city', variantId: 'default' },
        'city',
      ),
    ).toEqual({ type: 'link', objectKind: 'city', linkedScale: 'city' });
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

describe('resolveLocationPlacedKindToAction', () => {
  it('city on world opens link modal to city scale', () => {
    expect(resolveLocationPlacedKindToAction('city', 'world')).toEqual({
      kind: 'link-modal',
      objectKind: 'city',
      linkedScale: 'city',
    });
  });

  it('city on city opens link modal when registry allows city host scale', () => {
    expect(resolveLocationPlacedKindToAction('city', 'city')).toEqual({
      kind: 'link-modal',
      objectKind: 'city',
      linkedScale: 'city',
    });
  });

  it('tree on city places marker with authoredPlaceKindId tree', () => {
    expect(resolveLocationPlacedKindToAction('tree', 'city')).toEqual({
      kind: 'place-object',
      mapObjectKind: 'marker',
      authoredPlaceKindId: 'tree',
    });
  });

  it('stairs and treasure on floor map to persisted kinds with authoredPlaceKindId', () => {
    expect(resolveLocationPlacedKindToAction('stairs', 'floor')).toEqual({
      kind: 'place-object',
      mapObjectKind: 'stairs',
      authoredPlaceKindId: 'stairs',
    });
    expect(resolveLocationPlacedKindToAction('treasure', 'floor')).toEqual({
      kind: 'place-object',
      mapObjectKind: 'treasure',
      authoredPlaceKindId: 'treasure',
    });
  });

  it('table on floor maps to persisted table with authoredPlaceKindId', () => {
    expect(resolveLocationPlacedKindToAction('table', 'floor')).toEqual({
      kind: 'place-object',
      mapObjectKind: 'table',
      authoredPlaceKindId: 'table',
    });
  });

  it('building on city places map marker with authoredPlaceKindId (registry map-object family)', () => {
    expect(resolveLocationPlacedKindToAction('building', 'city')).toEqual({
      kind: 'place-object',
      mapObjectKind: 'marker',
      authoredPlaceKindId: 'building',
    });
  });

  it('site on city still opens link modal to site scale', () => {
    expect(resolveLocationPlacedKindToAction('site', 'city')).toEqual({
      kind: 'link-modal',
      objectKind: 'site',
      linkedScale: 'site',
    });
  });
});
