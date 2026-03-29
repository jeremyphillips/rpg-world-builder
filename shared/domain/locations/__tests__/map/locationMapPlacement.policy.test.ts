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
  it('exposes explicit host → target scale lists (not inferred from order alone)', () => {
    expect(ALLOWED_LINKED_LOCATION_SCALES_BY_HOST_SCALE.world).toEqual([
      'region',
      'subregion',
      'city',
      'site',
    ]);
    expect(getAllowedLinkedLocationScalesForHostScale('room')).toEqual([]);
  });

  it('rejects world as link target from city (ordering would allow broader; policy does not)', () => {
    expect(canLinkLocationScaleFromHostScale('city', 'world')).toBe(false);
    expect(canLinkLocationScaleFromHostScale('city', 'district')).toBe(true);
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
      { id: 'h', scale: 'district', campaignId: 'c1' },
      { id: 'd1', scale: 'district', campaignId: 'c1' },
      { id: 'x', scale: 'district', campaignId: 'c2' },
    ];
    const ok = getAllowedLinkedLocationOptions(host, candidates, { campaignId: 'c1' });
    expect(ok.map((l) => l.id)).toEqual(['d1']);
  });
});

describe('locationMapPlacement.policy — object kinds', () => {
  it('gates kinds by host scale', () => {
    expect(ALLOWED_MAP_OBJECT_KINDS_BY_HOST_SCALE.world).toEqual(['marker']);
    expect(getAllowedObjectKindsForHostScale('building')).toContain('stairs');
    expect(getAllowedObjectKindsForHostScale('room')).not.toContain('stairs');
    expect(canPlaceObjectKindOnHostScale('room', 'stairs')).toBe(false);
    expect(canPlaceObjectKindOnHostScale('floor', 'stairs')).toBe(true);
  });
});
