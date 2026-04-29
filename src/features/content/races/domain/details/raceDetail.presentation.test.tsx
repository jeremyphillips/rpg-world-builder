import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemRace } from '@/features/mechanics/domain/rulesets/system/races';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';

import { RACE_DETAIL_SPECS, type RaceDetailCtx } from './raceDetail.spec';

const ctx: RaceDetailCtx = {};

describe('race detail presentation', () => {
  const human = getSystemRace(DEFAULT_SYSTEM_RULESET_ID, 'human');

  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    expect(human).toBeDefined();
    const main = buildDetailItemsFromSpecs(RACE_DETAIL_SPECS, human!, ctx, { section: 'main' });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    expect(human).toBeDefined();
    const patched = { ...human!, patched: true as boolean };
    const metaPlayer = buildDetailItemsFromSpecs(RACE_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(RACE_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    expect(human).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(RACE_DETAIL_SPECS, human!, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    expect(human).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(RACE_DETAIL_SPECS, human!, ctx, {
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
