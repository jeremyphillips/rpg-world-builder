import { describe, expect, it } from 'vitest';

import { LOCATION_MAP_DEFAULT_REGION_NAME } from './locationMapRegion.constants';
import { normalizeRegionAuthoringEntry } from './locationMapRegionAuthoring.normalize';

describe('normalizeRegionAuthoringEntry', () => {
  it('maps legacy label to name', () => {
    expect(
      normalizeRegionAuthoringEntry({
        id: 'r1',
        colorKey: 'regionRed',
        label: 'Old',
      }),
    ).toEqual({
      id: 'r1',
      colorKey: 'regionRed',
      name: 'Old',
    });
  });

  it('prefers name over label when both exist', () => {
    expect(
      normalizeRegionAuthoringEntry({
        id: 'r1',
        colorKey: 'regionGreen',
        name: 'New',
        label: 'Old',
      }),
    ).toEqual({
      id: 'r1',
      colorKey: 'regionGreen',
      name: 'New',
    });
  });

  it('uses default name when missing', () => {
    expect(
      normalizeRegionAuthoringEntry({
        id: 'r1',
        colorKey: 'regionBlue',
      }),
    ).toEqual({
      id: 'r1',
      colorKey: 'regionBlue',
      name: LOCATION_MAP_DEFAULT_REGION_NAME,
    });
  });

  it('preserves description when present', () => {
    expect(
      normalizeRegionAuthoringEntry({
        id: 'r1',
        colorKey: 'regionTeal',
        name: 'A',
        description: '  Notes  ',
      }),
    ).toEqual({
      id: 'r1',
      colorKey: 'regionTeal',
      name: 'A',
      description: 'Notes',
    });
  });
});
