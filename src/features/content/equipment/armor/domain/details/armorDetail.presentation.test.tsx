import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import type { Armor } from '@/features/content/equipment/armor/domain/types';

import { ARMOR_DETAIL_SPECS, type ArmorDetailCtx } from './armorDetail.spec';

const ctx: ArmorDetailCtx = { dexLabel: 'Full' };

function sampleArmor(overrides: Partial<Armor> = {}): Armor {
  return {
    id: 'armor-test-1',
    name: 'Test Armor',
    source: 'system',
    systemId: 'srd',
    description: 'Test mail.',
    accessPolicy: { scope: 'public' },
    patched: false,
    category: 'medium',
    material: 'metal',
    cost: { coin: 'gp', value: 50 },
    baseAC: 16,
    stealthDisadvantage: false,
    ...overrides,
  } as Armor;
}

describe('armor detail presentation', () => {
  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    const armor = sampleArmor();
    const main = buildDetailItemsFromSpecs(ARMOR_DETAIL_SPECS, armor, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    const armor = sampleArmor({ patched: true });
    const metaPlayer = buildDetailItemsFromSpecs(ARMOR_DETAIL_SPECS, armor, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(ARMOR_DETAIL_SPECS, armor, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    const armor = sampleArmor();
    const advanced = buildDetailItemsFromSpecs(ARMOR_DETAIL_SPECS, armor, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    const armor = sampleArmor();
    const advanced = buildDetailItemsFromSpecs(ARMOR_DETAIL_SPECS, armor, ctx, {
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
