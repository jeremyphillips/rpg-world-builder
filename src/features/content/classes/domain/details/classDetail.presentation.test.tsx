import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import type { ClassContentItem } from '@/features/content/classes/domain/repo/classRepo';

import { CLASS_DETAIL_SPECS, type ClassDetailCtx } from './classDetail.spec';

const ctx: ClassDetailCtx = {};

function sampleFighter(): ClassContentItem {
  const c = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'fighter')!;
  return {
    ...c,
    source: 'system',
    systemId: DEFAULT_SYSTEM_RULESET_ID,
    patched: false,
  };
}

describe('class detail presentation', () => {
  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    const cls = sampleFighter();
    const main = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, cls, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs main uses readable proficiency summary (not raw JSON)', () => {
    const cls = sampleFighter();
    const main = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, cls, ctx, { section: 'main' });
    const prof = main.find((row) => row.label === 'Proficiencies');
    expect(prof?.value).toBeDefined();
    const { container } = render(<Fragment>{prof?.value}</Fragment>);
    expect(container.textContent).toMatch(/Skills: choose/i);
    expect(container.textContent).not.toMatch(/^\s*\{/);
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    const cls = { ...sampleFighter(), patched: true as boolean };
    const metaPlayer = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, cls, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, cls, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    const cls = sampleFighter();
    const advanced = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, cls, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    const cls = sampleFighter();
    const advanced = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, cls, ctx, {
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
