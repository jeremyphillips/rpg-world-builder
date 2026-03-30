// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE,
  canHostMapZoneKind,
  getAllowedMapZoneKindsForHostScale,
} from '../../zones/mapZone.policy';

describe('mapZone.policy', () => {
  it('maps world and city; other scales empty in phase 1', () => {
    expect(ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE.world).toEqual(['region', 'subregion']);
    expect(ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE.city).toEqual(['district']);
    expect(ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE.site).toEqual([]);
    expect(ALLOWED_MAP_ZONE_KINDS_BY_HOST_SCALE.floor).toEqual([]);
  });

  it('helpers', () => {
    expect(getAllowedMapZoneKindsForHostScale('world')).toEqual(['region', 'subregion']);
    expect(canHostMapZoneKind('world', 'region')).toBe(true);
    expect(canHostMapZoneKind('world', 'district')).toBe(false);
    expect(canHostMapZoneKind('city', 'district')).toBe(true);
    expect(canHostMapZoneKind('invalid', 'region')).toBe(false);
  });
});
