import { describe, expect, it } from 'vitest';

import { LOCATION_MAP_DEFAULT_REGION_NAME } from '@/shared/domain/locations/map/locationMapRegion.constants';

import {
  normalizeRegionDescriptionForDraft,
  normalizeRegionNameForDraft,
  regionMetadataToFormValues,
} from './regionMetadataDraftAdapter';

describe('regionMetadataDraftAdapter', () => {
  it('regionMetadataToFormValues maps description undefined to empty string', () => {
    expect(
      regionMetadataToFormValues({
        id: 'r1',
        name: 'A',
        colorKey: 'regionRed',
      }).description,
    ).toBe('');
  });

  it('normalizeRegionNameForDraft trims and falls back to default', () => {
    expect(normalizeRegionNameForDraft('  x  ')).toBe('x');
    expect(normalizeRegionNameForDraft('   ')).toBe(LOCATION_MAP_DEFAULT_REGION_NAME);
  });

  it('normalizeRegionDescriptionForDraft trims to undefined when empty', () => {
    expect(normalizeRegionDescriptionForDraft('  hi  ')).toBe('hi');
    expect(normalizeRegionDescriptionForDraft('  \n  ')).toBeUndefined();
  });
});
