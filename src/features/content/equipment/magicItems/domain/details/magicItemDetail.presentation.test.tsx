import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import type { MagicItem } from '@/features/content/equipment/magicItems/domain/types';

import { MAGIC_ITEM_DETAIL_SPECS, type MagicItemDetailCtx } from './magicItemDetail.spec';

const ctx: MagicItemDetailCtx = {};

function sampleMagicItem(overrides: Partial<MagicItem> = {}): MagicItem {
  return {
    id: 'magic-item-test-1',
    name: 'Test Magic Item',
    source: 'system',
    systemId: 'srd',
    description: 'Glows faintly.',
    accessPolicy: { scope: 'public' },
    patched: false,
    slot: 'weapon',
    requiresAttunement: false,
    effects: [{ kind: 'custom', id: 'e1', text: '+1 to attack rolls' }],
    ...overrides,
  } as MagicItem;
}

describe('magic item detail presentation', () => {
  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    const item = sampleMagicItem();
    const main = buildDetailItemsFromSpecs(MAGIC_ITEM_DETAIL_SPECS, item, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    const item = sampleMagicItem({ patched: true });
    const metaPlayer = buildDetailItemsFromSpecs(MAGIC_ITEM_DETAIL_SPECS, item, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(MAGIC_ITEM_DETAIL_SPECS, item, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    const item = sampleMagicItem();
    const advanced = buildDetailItemsFromSpecs(MAGIC_ITEM_DETAIL_SPECS, item, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    const item = sampleMagicItem();
    const advanced = buildDetailItemsFromSpecs(MAGIC_ITEM_DETAIL_SPECS, item, ctx, {
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
