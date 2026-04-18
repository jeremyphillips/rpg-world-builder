import { Fragment } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemSkillProficiency } from '@/features/mechanics/domain/rulesets/system/skillProficiencies';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';

import { SKILL_PROFICIENCY_DETAIL_SPECS, type SkillProficiencyDetailCtx } from './skillProficiencyDetail.spec';

const ctx: SkillProficiencyDetailCtx = {};

describe('skill proficiency detail presentation', () => {
  const stealth = getSystemSkillProficiency(DEFAULT_SYSTEM_RULESET_ID, 'stealth');

  it('buildDetailItemsFromSpecs main section excludes meta-only fields', () => {
    expect(stealth).toBeDefined();
    const main = buildDetailItemsFromSpecs(SKILL_PROFICIENCY_DETAIL_SPECS, stealth!, ctx, {
      section: 'main',
    });
    expect(main.find((row) => row.label === 'Source')).toBeUndefined();
  });

  it('buildDetailItemsFromSpecs meta gates Patched row to privileged content-meta viewers', () => {
    expect(stealth).toBeDefined();
    const patched = { ...stealth!, patched: true as boolean };
    const metaPlayer = buildDetailItemsFromSpecs(SKILL_PROFICIENCY_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: null },
    });
    expect(metaPlayer.find((row) => row.label === 'Patched')).toBeUndefined();

    const metaDm = buildDetailItemsFromSpecs(SKILL_PROFICIENCY_DETAIL_SPECS, patched, ctx, {
      section: 'meta',
      viewer: { isPlatformAdmin: false, campaignRole: 'dm' },
    });
    expect(metaDm.find((row) => row.label === 'Patched')).toBeDefined();
  });

  it('buildDetailItemsFromSpecs advanced section is empty for non–platform admins', () => {
    expect(stealth).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(SKILL_PROFICIENCY_DETAIL_SPECS, stealth!, ctx, {
      section: 'advanced',
      viewer: { isPlatformAdmin: false },
    });
    expect(advanced).toHaveLength(0);
  });

  it('buildDetailItemsFromSpecs advanced section includes full record JSON for platform admins', () => {
    expect(stealth).toBeDefined();
    const advanced = buildDetailItemsFromSpecs(SKILL_PROFICIENCY_DETAIL_SPECS, stealth!, ctx, {
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
