// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  getLocationScaleRank,
  isBroaderLocationScale,
  isSameOrBroaderLocationScale,
  locationScaleRank,
} from '../../scale/locationScale.rules';

describe('locationScale.rules (generic ordering)', () => {
  it('getLocationScaleRank matches locationScaleRank', () => {
    expect(getLocationScaleRank('world')).toBe(0);
    expect(locationScaleRank('room')).toBe(8);
    expect(getLocationScaleRank('unknown')).toBe(-1);
  });

  it('isBroaderLocationScale uses order only', () => {
    expect(isBroaderLocationScale('world', 'city')).toBe(true);
    expect(isBroaderLocationScale('city', 'world')).toBe(false);
    expect(isBroaderLocationScale('city', 'city')).toBe(false);
  });

  it('isSameOrBroaderLocationScale', () => {
    expect(isSameOrBroaderLocationScale('city', 'city')).toBe(true);
    expect(isSameOrBroaderLocationScale('district', 'city')).toBe(false);
  });
});
