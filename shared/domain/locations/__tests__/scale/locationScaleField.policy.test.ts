// @vitest-environment node
import { describe, expect, it } from 'vitest';

import {
  isCategoryAllowedForScale,
  isCellUnitAllowedForScale,
  normalizeCategoryForScale,
  normalizeGridCellUnitForScale,
  getAllowedGeometriesForScale,
  getDefaultGeometryForScale,
  shouldShowGridGeometryFieldForScale,
  isGridGeometryFieldReadOnlyForScale,
  normalizeGridGeometryForScale,
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

describe('locationScaleField.policy (geometry)', () => {
  it('world/region/subregion: hex only, hidden field', () => {
    for (const s of ['world', 'region', 'subregion'] as const) {
      expect(getAllowedGeometriesForScale(s)).toEqual(['hex']);
      expect(getDefaultGeometryForScale(s)).toBe('hex');
      expect(shouldShowGridGeometryFieldForScale(s)).toBe(false);
      expect(isGridGeometryFieldReadOnlyForScale(s)).toBe(true);
    }
  });

  it('city: square+hex, default hex, field visible', () => {
    expect(getAllowedGeometriesForScale('city')).toEqual(['square', 'hex']);
    expect(getDefaultGeometryForScale('city')).toBe('hex');
    expect(shouldShowGridGeometryFieldForScale('city')).toBe(true);
    expect(isGridGeometryFieldReadOnlyForScale('city')).toBe(false);
  });

  it('district/site: square+hex, default square', () => {
    for (const s of ['district', 'site'] as const) {
      expect(getAllowedGeometriesForScale(s)).toEqual(['square', 'hex']);
      expect(getDefaultGeometryForScale(s)).toBe('square');
      expect(shouldShowGridGeometryFieldForScale(s)).toBe(true);
    }
  });

  it('building/floor/room: square only, hidden field', () => {
    for (const s of ['building', 'floor', 'room'] as const) {
      expect(getAllowedGeometriesForScale(s)).toEqual(['square']);
      expect(getDefaultGeometryForScale(s)).toBe('square');
      expect(shouldShowGridGeometryFieldForScale(s)).toBe(false);
      expect(isGridGeometryFieldReadOnlyForScale(s)).toBe(true);
    }
  });

  it('normalizeGridGeometryForScale returns allowed or default', () => {
    expect(normalizeGridGeometryForScale('hex', 'world')).toBe('hex');
    expect(normalizeGridGeometryForScale('square', 'world')).toBe('hex');
    expect(normalizeGridGeometryForScale('hex', 'city')).toBe('hex');
    expect(normalizeGridGeometryForScale('square', 'city')).toBe('square');
    expect(normalizeGridGeometryForScale('', 'city')).toBe('hex');
    expect(normalizeGridGeometryForScale('square', 'building')).toBe('square');
    expect(normalizeGridGeometryForScale('hex', 'building')).toBe('square');
  });

  it('fallback policy (unknown scale) → square only', () => {
    expect(getAllowedGeometriesForScale('unknown')).toEqual(['square']);
    expect(getDefaultGeometryForScale('unknown')).toBe('square');
    expect(shouldShowGridGeometryFieldForScale('unknown')).toBe(false);
  });
});
