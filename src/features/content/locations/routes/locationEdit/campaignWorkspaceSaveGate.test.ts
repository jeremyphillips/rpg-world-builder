import { describe, expect, it } from 'vitest';

import { LOCATION_FORM_DEFAULTS } from '@/features/content/locations/domain';

import { getCampaignWorkspaceSaveBlockReason } from './campaignWorkspaceSaveGate';

describe('getCampaignWorkspaceSaveBlockReason', () => {
  const buildingLoc = {
    id: 'b1',
    source: 'campaign' as const,
    scale: 'building' as const,
    name: 'B',
    campaignId: 'c1',
  };

  it('blocks when building has no active floor', () => {
    expect(
      getCampaignWorkspaceSaveBlockReason(buildingLoc as never, null, LOCATION_FORM_DEFAULTS),
    ).toBe('Add a floor before saving.');
  });

  it('allows when building has active floor and grid is valid', () => {
    const v = {
      ...LOCATION_FORM_DEFAULTS,
      gridColumns: '10',
      gridRows: '10',
      gridCellUnit: 'ft',
    };
    expect(getCampaignWorkspaceSaveBlockReason(buildingLoc as never, 'f1', v)).toBeNull();
  });

  it('returns validateGridBootstrap message when grid invalid', () => {
    const v = {
      ...LOCATION_FORM_DEFAULTS,
      gridColumns: '0',
      gridRows: '10',
      gridCellUnit: 'ft',
    };
    expect(getCampaignWorkspaceSaveBlockReason(buildingLoc as never, 'f1', v)).toMatch(/columns/i);
  });
});
