// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildAncestorIdsFromParentRow,
  scaleRank,
  validateParentChildScales,
  LOCATION_SCALE_ORDER,
} from './locations.hierarchy';

describe('locations.hierarchy', () => {
  it('scaleRank matches LOCATION_SCALE_ORDER indices', () => {
    LOCATION_SCALE_ORDER.forEach((s, i) => {
      expect(scaleRank(s)).toBe(i);
    });
    expect(scaleRank('unknown-scale')).toBe(-1);
  });

  it('buildAncestorIdsFromParentRow appends parent locationId', () => {
    expect(
      buildAncestorIdsFromParentRow({ locationId: 'p', ancestorIds: ['a', 'b'] }),
    ).toEqual(['a', 'b', 'p']);
    expect(buildAncestorIdsFromParentRow({ locationId: 'root', ancestorIds: [] })).toEqual(['root']);
  });

  it('validateParentChildScales uses explicit allowed-parent policy', () => {
    expect(validateParentChildScales('city', 'district')).toBeNull();
    const same = validateParentChildScales('city', 'city');
    expect(same?.code).toBe('INVALID_NESTING');
    const narrower = validateParentChildScales('room', 'city');
    expect(narrower?.code).toBe('INVALID_NESTING');
    expect(validateParentChildScales('world', 'city')).toBeNull();
    expect(validateParentChildScales('region', 'city')).toBeNull();
    expect(validateParentChildScales('subregion', 'city')).toBeNull();
  });

  it('validateParentChildScales rejects unknown scales', () => {
    const u = validateParentChildScales('nope', 'city');
    expect(u?.code).toBe('INVALID_SCALE');
    const v = validateParentChildScales('city', 'nope');
    expect(v?.code).toBe('INVALID_SCALE');
  });
});
