import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import type { Weapon } from '@/features/content/equipment/weapons/domain/types';

import { WEAPON_DETAIL_SPECS, type WeaponDetailCtx } from './weaponDetail.spec';

const ctx: WeaponDetailCtx = {};

function sampleWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: 'weapon-test-1',
    name: 'Test Weapon',
    source: 'system',
    systemId: 'srd',
    description: 'A test blade.',
    accessPolicy: { scope: 'public' },
    patched: false,
    category: 'simple',
    mode: 'melee',
    cost: { coin: 'gp', value: 15 },
    properties: ['light'],
    damage: { default: '1d6' },
    damageType: 'slashing',
    ...overrides,
  } as Weapon;
}

describe('weapon detail presentation', () => {
  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    const weapon = sampleWeapon();
    const main = buildDetailItemsFromSpecs(WEAPON_DETAIL_SPECS, weapon, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
    expect(main.find((row) => row.label === 'Visibility')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    const weapon = sampleWeapon({ patched: true });
    const metaPlayer = buildDetailItemsFromSpecs(WEAPON_DETAIL_SPECS, weapon, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(WEAPON_DETAIL_SPECS, weapon, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    const weapon = sampleWeapon();
    const advanced = buildDetailItemsFromSpecs(WEAPON_DETAIL_SPECS, weapon, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    const weapon = sampleWeapon();
    const advanced = buildDetailItemsFromSpecs(WEAPON_DETAIL_SPECS, weapon, ctx, {
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
