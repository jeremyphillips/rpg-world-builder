import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemSpell } from '@/features/mechanics/domain/rulesets/system/spells';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';

import { SPELL_DETAIL_SPECS, type SpellDetailCtx } from './spellDetail.spec';

const ctx: SpellDetailCtx = {};

describe('spell detail presentation', () => {
  const fireball = getSystemSpell(DEFAULT_SYSTEM_RULESET_ID, 'fireball');

  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    expect(fireball).toBeDefined();
    const main = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, fireball!, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
    expect(main.find((row) => row.label === 'Visibility')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta includes source for any viewer but gates visibility', () => {
    expect(fireball).toBeDefined();
    const metaPlayer = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, fireball!, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Source')).toBeDefined();
    expect(metaPlayer.find((row) => row.label === 'Visibility')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, fireball!, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Visibility')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    expect(fireball).toBeDefined();
    const patched = { ...fireball!, patched: true as boolean };
    const metaPlayer = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    expect(fireball).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, fireball!, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    expect(fireball).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(SPELL_DETAIL_SPECS, fireball!, ctx, {
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
