import { describe, expect, it } from 'vitest';

import {
  normalizeEdgeAuthoringEntryForPersistence,
  normalizeEdgeAuthoringEntriesForPersistence,
} from '../locationMapEdgeAuthoring.normalize';

describe('normalizeEdgeAuthoringEntryForPersistence', () => {
  it('accepts legacy coarse-only row unchanged', () => {
    const row = { edgeId: 'between:0,0|1,0', kind: 'door' as const };
    expect(normalizeEdgeAuthoringEntryForPersistence(row)).toEqual(row);
  });

  it('accepts aligned authored row', () => {
    const row = {
      edgeId: 'between:0,0|1,0',
      kind: 'door' as const,
      authoredPlaceKindId: 'door',
      variantId: 'single_wood',
      label: 'South Door',
    };
    expect(normalizeEdgeAuthoringEntryForPersistence(row)).toEqual({
      edgeId: 'between:0,0|1,0',
      kind: 'door',
      authoredPlaceKindId: 'door',
      variantId: 'single_wood',
      label: 'South Door',
    });
  });

  it('repairs kind when authored identity conflicts with coarse wall', () => {
    const row = {
      edgeId: 'between:0,0|1,0',
      kind: 'wall' as const,
      authoredPlaceKindId: 'door',
      variantId: 'single_wood',
    };
    expect(normalizeEdgeAuthoringEntryForPersistence(row)).toEqual({
      edgeId: 'between:0,0|1,0',
      kind: 'door',
      authoredPlaceKindId: 'door',
      variantId: 'single_wood',
    });
  });

  it('strips invalid variant id consistently', () => {
    const row = {
      edgeId: 'between:0,0|1,0',
      kind: 'door' as const,
      authoredPlaceKindId: 'door',
      variantId: 'not_real',
    };
    expect(normalizeEdgeAuthoringEntryForPersistence(row)).toEqual({
      edgeId: 'between:0,0|1,0',
      kind: 'door',
      authoredPlaceKindId: 'door',
    });
  });

  it('strips invalid authoredPlaceKindId string', () => {
    const row = {
      edgeId: 'between:0,0|1,0',
      kind: 'door' as const,
      authoredPlaceKindId: 'nope',
      variantId: 'single_wood',
    };
    expect(normalizeEdgeAuthoringEntryForPersistence(row)).toEqual({
      edgeId: 'between:0,0|1,0',
      kind: 'door',
      variantId: 'single_wood',
    });
  });

  it('normalizes arrays', () => {
    const rows = [{ edgeId: 'e1', kind: 'wall' as const }];
    expect(normalizeEdgeAuthoringEntriesForPersistence(rows)).toEqual(rows);
  });
});
