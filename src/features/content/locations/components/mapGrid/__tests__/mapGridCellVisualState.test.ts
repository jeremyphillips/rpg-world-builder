// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  isSelectHoverChromeSuppressed,
  shouldApplyCellHoverChrome,
  shouldApplyCellSelectedChrome,
} from '../mapGridCellVisualState';

describe('shouldApplyCellHoverChrome', () => {
  it('applies to all cells when Select rules are not active (undefined target)', () => {
    expect(shouldApplyCellHoverChrome('0,0', undefined)).toBe(true);
    expect(shouldApplyCellHoverChrome('1,1', undefined)).toBe(true);
  });

  it('does not apply when hover is none (no resolved winner yet)', () => {
    expect(shouldApplyCellHoverChrome('0,0', { type: 'none' })).toBe(false);
  });

  it('applies only to the cell when hover winner is cell', () => {
    expect(shouldApplyCellHoverChrome('0,0', { type: 'cell', cellId: '0,0' })).toBe(true);
    expect(shouldApplyCellHoverChrome('1,0', { type: 'cell', cellId: '0,0' })).toBe(false);
  });

  it('does not apply when hover winner is region', () => {
    expect(shouldApplyCellHoverChrome('0,0', { type: 'region', regionId: 'r1' })).toBe(false);
  });

  it('does not apply when hover winner is object, path, or edge-run', () => {
    expect(
      shouldApplyCellHoverChrome('0,0', {
        type: 'object',
        cellId: '0,0',
        objectId: 'o1',
      }),
    ).toBe(false);
    expect(shouldApplyCellHoverChrome('0,0', { type: 'path', pathId: 'p1' })).toBe(false);
    expect(
      shouldApplyCellHoverChrome('0,0', {
        type: 'edge-run',
        kind: 'wall',
        edgeIds: ['a'],
        axis: 'horizontal',
        anchorEdgeId: 'a',
      }),
    ).toBe(false);
  });
});

describe('isSelectHoverChromeSuppressed', () => {
  it('is false when Select rules are not active, none-target, disabled, or this cell wins hover', () => {
    expect(isSelectHoverChromeSuppressed('0,0', undefined, false)).toBe(false);
    expect(isSelectHoverChromeSuppressed('0,0', { type: 'none' }, false)).toBe(false);
    expect(
      isSelectHoverChromeSuppressed('0,0', { type: 'region', regionId: 'r1' }, true),
    ).toBe(false);
    expect(
      isSelectHoverChromeSuppressed('0,0', { type: 'cell', cellId: '0,0' }, false),
    ).toBe(false);
  });

  it('is true when there is a non-none winner and this cell does not get cell hover', () => {
    expect(
      isSelectHoverChromeSuppressed('1,0', { type: 'cell', cellId: '0,0' }, false),
    ).toBe(true);
    expect(
      isSelectHoverChromeSuppressed('0,0', { type: 'region', regionId: 'r1' }, false),
    ).toBe(true);
  });
});

describe('shouldApplyCellSelectedChrome', () => {
  it('is true when selectedCellId matches', () => {
    expect(shouldApplyCellSelectedChrome('0,0', '0,0')).toBe(true);
    expect(shouldApplyCellSelectedChrome('0,0', '1,0')).toBe(false);
  });

  it('is false when null or undefined', () => {
    expect(shouldApplyCellSelectedChrome(null, '0,0')).toBe(false);
    expect(shouldApplyCellSelectedChrome(undefined, '0,0')).toBe(false);
  });
});
