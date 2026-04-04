import { describe, expect, it } from 'vitest';

import { LOCATION_FORM_DEFAULTS } from '@/features/content/locations/domain';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

import { getHomebrewWorkspaceSaveBlockReason } from './homebrewWorkspaceSaveGate';

describe('getHomebrewWorkspaceSaveBlockReason', () => {
  it('blocks building workspace when no active floor', () => {
    const buildingLoc = {
      source: 'campaign',
      scale: 'building',
    } as LocationContentItem;
    expect(
      getHomebrewWorkspaceSaveBlockReason(buildingLoc as never, null, LOCATION_FORM_DEFAULTS),
    ).toMatch(/floor/i);
  });

  it('allows building workspace when a floor is active', () => {
    const buildingLoc = {
      source: 'campaign',
      scale: 'building',
    } as LocationContentItem;
    const v = { ...LOCATION_FORM_DEFAULTS, gridColumns: '10', gridRows: '10' };
    expect(getHomebrewWorkspaceSaveBlockReason(buildingLoc as never, 'f1', v)).toBeNull();
  });

  it('returns grid bootstrap message when invalid', () => {
    const buildingLoc = {
      source: 'campaign',
      scale: 'building',
    } as LocationContentItem;
    const v = { ...LOCATION_FORM_DEFAULTS, gridColumns: '0', gridRows: '10' };
    expect(getHomebrewWorkspaceSaveBlockReason(buildingLoc as never, 'f1', v)).toMatch(/columns/i);
  });
});
