// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE,
  ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE,
  canLinkLocationScaleFromHostScale,
  canPlaceObjectKindOnHostScale,
  getAllowedLinkedLocationOptions,
  getAllowedLinkedLocationScalesForHostScale,
  getAllowedObjectKindsForHostScale,
  isAllowedLinkedLocation,
} from '../../map/locationMapPlacement.policy';

describe('locationMapPlacement.policy — linked locations', () => {
  it('exposes explicit host → target scale lists (derived from placed-object registry + structural links)', () => {
    expect(ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.world).toEqual(['city', 'site']);
    expect(ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.city).toEqual(['city', 'site', 'building']);
    expect(getAllowedLinkedLocationScalesForHostScale('room')).toEqual([]);
  });

  it('rejects non-child scales as link targets (e.g. world from city; legacy region/subregion/district)', () => {
    expect(canLinkLocationScaleFromHostScale('city', 'world')).toBe(false);
    expect(canLinkLocationScaleFromHostScale('city', 'district')).toBe(false);
    expect(canLinkLocationScaleFromHostScale('city', 'site')).toBe(true);
    expect(canLinkLocationScaleFromHostScale('city', 'city')).toBe(true);
  });

  it('isAllowedLinkedLocation rejects same id', () => {
    expect(
      isAllowedLinkedLocation(
        { id: 'a', scale: 'floor' },
        { id: 'a', scale: 'room' },
      ),
    ).toBe(false);
    expect(
      isAllowedLinkedLocation(
        { id: 'h', scale: 'floor' },
        { id: 'r', scale: 'room' },
      ),
    ).toBe(true);
  });

  it('getAllowedLinkedLocationOptions excludes self and optional campaignId', () => {
    const host = { id: 'h', scale: 'city', campaignId: 'c1' };
    const candidates = [
      { id: 'h', scale: 'site', campaignId: 'c1' },
      { id: 's1', scale: 'site', campaignId: 'c1' },
      { id: 'x', scale: 'site', campaignId: 'c2' },
    ];
    const ok = getAllowedLinkedLocationOptions(host, candidates, { campaignId: 'c1' });
    expect(ok.map((l) => l.id)).toEqual(['s1']);
  });
});

describe('locationMapPlacement.policy — object kinds', () => {
  it('gates kinds by host scale', () => {
    expect(ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE.world).toEqual(['marker']);
    expect(getAllowedObjectKindsForHostScale('building')).toEqual([]);
    expect(getAllowedObjectKindsForHostScale('floor')).toEqual([
      'table',
      'door',
      'treasure',
      'stairs',
    ]);
    expect(getAllowedObjectKindsForHostScale('floor')).not.toContain('marker');
    expect(getAllowedObjectKindsForHostScale('room')).not.toContain('stairs');
    expect(canPlaceObjectKindOnHostScale('room', 'stairs')).toBe(false);
    expect(canPlaceObjectKindOnHostScale('floor', 'stairs')).toBe(true);
    expect(canPlaceObjectKindOnHostScale('floor', 'marker')).toBe(false);
  });
});
