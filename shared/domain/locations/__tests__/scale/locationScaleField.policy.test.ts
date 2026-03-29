// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  isCategoryAllowedForScale,
  isCellUnitAllowedForScale,
  normalizeCategoryForScale,
  normalizeGridCellUnitForScale,
} from '../../scale/locationScaleField.policy';

describe('locationScaleField.policy', () => {
  it('world: mile only, no category', () => {
    expect(isCellUnitAllowedForScale('mile', 'world')).toBe(true);
    expect(isCellUnitAllowedForScale('5ft', 'world')).toBe(false);
    expect(isCategoryAllowedForScale('settlement', 'world')).toBe(false);
    expect(normalizeCategoryForScale('settlement', 'world')).toBe('');
  });

  it('city: settlement + block', () => {
    expect(normalizeCategoryForScale('', 'city')).toBe('settlement');
    expect(isCellUnitAllowedForScale('block', 'city')).toBe(true);
    expect(isCellUnitAllowedForScale('5ft', 'city')).toBe(false);
    expect(normalizeGridCellUnitForScale('5ft', 'city')).toBe('block');
  });

  it('building: structure + 5ft', () => {
    expect(normalizeCategoryForScale('', 'building')).toBe('structure');
    expect(isCellUnitAllowedForScale('5ft', 'building')).toBe(true);
    expect(isCellUnitAllowedForScale('block', 'building')).toBe(false);
  });
});
