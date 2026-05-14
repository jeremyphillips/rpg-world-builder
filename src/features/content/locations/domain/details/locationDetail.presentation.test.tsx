import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import type { LocationContentItem } from '@/features/content/locations/domain/repo/locationRepo';

import { LOCATION_DETAIL_SPECS, type LocationDetailCtx } from './locationDetail.spec';

function sampleLocation(): LocationContentItem {
  return {
    id: 'loc-test-1',
    name: 'Sample Site',
    source: 'campaign',
    campaignId: 'campaign-test',
    description: 'A test location.',
    accessPolicy: { scope: 'public' },
    patched: false,
    scale: 'site',
    category: 'tavern',
    imageKey: null,
    ancestorIds: [],
    tags: ['urban'],
  };
}

describe('location detail presentation', () => {
  const ctx: LocationDetailCtx = { mapGridSummary: 'Grid: 12 × 8, ft' };

  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    const loc = sampleLocation();
    const main = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs passes map grid summary from ctx', () => {
    const loc = sampleLocation();
    const main = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, ctx, { section: 'main' });
    const grid = main.find((row) => row.label === 'Grid');
    expect(grid?.value).toMatch(/12/);
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    const loc = { ...sampleLocation(), patched: true as boolean };
    const metaPlayer = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    const loc = sampleLocation();
    const advanced = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    const loc = sampleLocation();
    const advanced = buildDetailItemsFromSpecs(LOCATION_DETAIL_SPECS, loc, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: true },
    });
    const raw = advanced.find((row) => row.label === 'Full record (JSON)');
    expect(raw?.value).toBeDefined();
    const { container } = render(<Fragment>{raw?.value}</Fragment>);
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toMatch(/"name"\s*:/);
  });
});
