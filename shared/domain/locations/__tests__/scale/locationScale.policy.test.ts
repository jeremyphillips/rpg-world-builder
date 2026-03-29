// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_PARENT_SCALES_BY_SCALE,
  getAllowedParentLocationOptions,
  getAllowedParentScalesForScale,
  isAllowedParentLocation,
  isAllowedParentScale,
} from '../../scale/locationScale.policy';

describe('locationScale.policy', () => {
  it('world has no parent scales', () => {
    expect(getAllowedParentScalesForScale('world')).toEqual([]);
    expect(isAllowedParentScale('region', 'world')).toBe(false);
  });

  it('city allows world, region, or subregion as parent (macro under world or regional geography)', () => {
    expect(ALLOWED_PARENT_SCALES_BY_SCALE.city).toEqual(['world', 'region', 'subregion']);
    expect(isAllowedParentScale('world', 'city')).toBe(true);
    expect(isAllowedParentScale('region', 'city')).toBe(true);
    expect(isAllowedParentScale('subregion', 'city')).toBe(true);
  });

  it('district allows city only', () => {
    expect(isAllowedParentScale('city', 'district')).toBe(true);
    expect(isAllowedParentScale('region', 'district')).toBe(false);
  });

  it('getAllowedParentLocationOptions filters by policy and excludes room parents and self', () => {
    const locs = [
      { id: 'w', scale: 'world' },
      { id: 'r', scale: 'region' },
      { id: 'c', scale: 'city' },
      { id: 'rm', scale: 'room' },
    ];
    const forCity = getAllowedParentLocationOptions(locs, 'city');
    expect(forCity.map((l) => l.id).sort()).toEqual(['r', 'w']);
    const forDistrict = getAllowedParentLocationOptions(locs, 'district', 'x');
    expect(forDistrict.map((l) => l.id)).toContain('c');
  });

  it('isAllowedParentLocation delegates to scale policy', () => {
    expect(isAllowedParentLocation({ scale: 'building' }, 'floor')).toBe(true);
    expect(isAllowedParentLocation({ scale: 'room' }, 'floor')).toBe(false);
  });
});
