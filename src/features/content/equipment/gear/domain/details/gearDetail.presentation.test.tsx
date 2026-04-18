import { Fragment } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import type { Gear } from '@/features/content/equipment/gear/domain/types/gear.types';

import { GEAR_DETAIL_SPECS, type GearDetailCtx } from './gearDetail.spec';

const ctx: GearDetailCtx = {};

function sampleGear(overrides: Partial<Gear> = {}): Gear {
  return {
    id: 'gear-test-1',
    name: 'Test Gear',
    source: 'system',
    systemId: 'srd',
    description: 'A test item.',
    accessPolicy: { scope: 'public' },
    patched: false,
    category: 'adventuring-gear',
    cost: { coin: 'cp', value: 100 },
    weight: { value: 1, unit: 'lb' },
    ...overrides,
  } as Gear;
}

describe('gear detail presentation', () => {
  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    const gear = sampleGear();
    const main = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
    expect(main.find((row) => row.label === 'Visibility')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta section includes source for any viewer but gates visibility', () => {
    const gear = sampleGear();
    const metaPlayer = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Source')).toBeDefined();
    expect(metaPlayer.find((row) => row.label === 'Visibility')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Visibility')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    const gear = sampleGear({ patched: true });
    const metaPlayer = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins (platformOwner raw rows)', () => {
    const gear = sampleGear();
    const advanced = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    const gear = sampleGear();
    const advanced = buildDetailItemsFromSpecs(GEAR_DETAIL_SPECS, gear, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: true },
    });
    expect(advanced.length).toBeGreaterThan(0);
    const raw = advanced.find((row) => row.label === 'Full record (JSON)');
    expect(raw?.value).toBeDefined();
    const { container } = render(<Fragment>{raw?.value}</Fragment>);
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toMatch(/"name"\s*:/);
  });
});
