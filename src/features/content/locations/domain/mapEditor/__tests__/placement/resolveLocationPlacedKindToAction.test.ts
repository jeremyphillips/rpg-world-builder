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
      resolvePlacedKindToAction({ category: 'linked-content', kind: 'city' }, 'world'),
    ).toEqual({ type: 'link', objectKind: 'city', linkedScale: 'city' });
  });

  it('map-object tree on city maps to marker with authoredPlaceKindId tree', () => {
    expect(resolvePlacedKindToAction({ category: 'map-object', kind: 'tree' }, 'city')).toEqual({
      type: 'object',
      objectKind: 'marker',
      authoredPlaceKindId: 'tree',
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

  it('building/site on city open link modal to building/site scale', () => {
    expect(resolveLocationPlacedKindToAction('building', 'city')).toEqual({
      kind: 'link-modal',
      objectKind: 'building',
      linkedScale: 'building',
    });
    expect(resolveLocationPlacedKindToAction('site', 'city')).toEqual({
      kind: 'link-modal',
      objectKind: 'site',
      linkedScale: 'site',
    });
  });
});
