import { describe, expect, it } from 'vitest';

import {
  resolveSelectModeAfterPathEdgeHits,
  resolveSelectModeRegionOrCellSelection,
} from './resolveSelectModeRegionOrCellSelection';

describe('resolveSelectModeRegionOrCellSelection', () => {
  it('returns region when cell has regionId', () => {
    expect(
      resolveSelectModeRegionOrCellSelection('1,1', { '1,1': 'reg-a', '2,2': 'reg-b' }),
    ).toEqual({ type: 'region', regionId: 'reg-a' });
  });

  it('returns cell when no region assignment', () => {
    expect(resolveSelectModeRegionOrCellSelection('0,0', {})).toEqual({ type: 'cell', cellId: '0,0' });
    expect(resolveSelectModeRegionOrCellSelection('0,0', { '1,1': 'x' })).toEqual({
      type: 'cell',
      cellId: '0,0',
    });
  });

  it('trims region id', () => {
    expect(resolveSelectModeRegionOrCellSelection('0,0', { '0,0': '  reg-x  ' })).toEqual({
      type: 'region',
      regionId: 'reg-x',
    });
  });

  it('treats empty trimmed region as cell selection', () => {
    expect(resolveSelectModeRegionOrCellSelection('0,0', { '0,0': '   ' })).toEqual({
      type: 'cell',
      cellId: '0,0',
    });
  });
});

describe('resolveSelectModeAfterPathEdgeHits', () => {
  const empty = {};

  it('prefers map object over region', () => {
    expect(
      resolveSelectModeAfterPathEdgeHits(
        '0,0',
        { '0,0': [{ id: 'obj-1' }] },
        {},
        { '0,0': 'reg-a' },
      ),
    ).toEqual({ type: 'object', cellId: '0,0', objectId: 'obj-1' });
  });

  it('prefers linked location over region when no objects', () => {
    expect(
      resolveSelectModeAfterPathEdgeHits(
        '0,0',
        {},
        { '0,0': 'loc-city' },
        { '0,0': 'reg-a' },
      ),
    ).toEqual({ type: 'cell', cellId: '0,0' });
  });

  it('falls back to region when no object or link', () => {
    expect(
      resolveSelectModeAfterPathEdgeHits('0,0', {}, empty, { '0,0': 'reg-a' }),
    ).toEqual({ type: 'region', regionId: 'reg-a' });
  });

  it('falls back to bare cell when nothing on cell', () => {
    expect(resolveSelectModeAfterPathEdgeHits('0,0', {}, empty, {})).toEqual({
      type: 'cell',
      cellId: '0,0',
    });
  });
});
