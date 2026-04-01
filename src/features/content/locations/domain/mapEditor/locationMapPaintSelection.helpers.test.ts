import { describe, expect, it } from 'vitest';

import type { LocationMapRegionAuthoringEntry } from '@/shared/domain/locations';
import { LOCATION_MAP_DEFAULT_REGION_NAME } from '@/shared/domain/locations/map/locationMapRegion.constants';

import {
  canApplyAnyPaintStroke,
  canApplyRegionPaint,
  createInitialPaintState,
  resolveActiveRegionEntry,
} from './locationMapPaintSelection.helpers';

const sampleRegions: LocationMapRegionAuthoringEntry[] = [
  {
    id: 'r1',
    colorKey: 'regionRed',
    name: LOCATION_MAP_DEFAULT_REGION_NAME,
  },
];

describe('locationMapPaintSelection.helpers', () => {
  it('createInitialPaintState starts in surface with no active region', () => {
    const s = createInitialPaintState();
    expect(s.domain).toBe('surface');
    expect(s.surfaceFillKind).toBeNull();
    expect(s.activeRegionId).toBeNull();
  });

  it('canApplyRegionPaint requires domain region and a matching region entry', () => {
    expect(canApplyRegionPaint(null, sampleRegions)).toBe(false);
    expect(
      canApplyRegionPaint(
        {
          domain: 'region',
          surfaceFillKind: null,
          activeRegionId: null,
        },
        sampleRegions,
      ),
    ).toBe(false);
    expect(
      canApplyRegionPaint(
        {
          domain: 'region',
          surfaceFillKind: null,
          activeRegionId: 'r1',
        },
        sampleRegions,
      ),
    ).toBe(true);
    expect(
      canApplyRegionPaint(
        {
          domain: 'region',
          surfaceFillKind: null,
          activeRegionId: 'missing',
        },
        sampleRegions,
      ),
    ).toBe(false);
  });

  it('canApplyAnyPaintStroke combines surface and region rules', () => {
    expect(
      canApplyAnyPaintStroke(
        {
          domain: 'surface',
          surfaceFillKind: 'water',
          activeRegionId: null,
        },
        sampleRegions,
      ),
    ).toBe(true);
    expect(
      canApplyAnyPaintStroke(
        {
          domain: 'region',
          surfaceFillKind: null,
          activeRegionId: 'r1',
        },
        sampleRegions,
      ),
    ).toBe(true);
  });

  it('resolveActiveRegionEntry returns null when id missing or unknown', () => {
    expect(resolveActiveRegionEntry(sampleRegions, null)).toBeNull();
    expect(resolveActiveRegionEntry(sampleRegions, 'x')).toBeNull();
    expect(resolveActiveRegionEntry(sampleRegions, 'r1')?.id).toBe('r1');
  });
});
