import { describe, it, expect } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '../ids/systemIds';
import { getSystemRuleset, systemCatalog } from '../system/catalog';
import { buildCampaignCatalog } from './buildCatalog';

describe('buildCampaignCatalog', () => {
  it('applies skillProficiencies all_except policy', () => {
    const system = getSystemRuleset(DEFAULT_SYSTEM_RULESET_ID);
    const ruleset = {
      ...system,
      content: {
        ...system.content,
        skillProficiencies: { policy: 'all_except' as const, ids: ['stealth'] },
      },
    };

    const catalog = buildCampaignCatalog(systemCatalog, {}, ruleset);

    expect(catalog.skillProficienciesById['stealth']).toBeUndefined();
    expect(catalog.skillProficienciesAllById?.['stealth']).toBeDefined();
    expect(catalog.skillProficiencyAllowedIds).toBeDefined();
    expect(catalog.skillProficiencyAllowedIds?.includes('stealth')).toBe(false);
    expect(catalog.skillProficiencyIds?.includes('stealth')).toBe(false);
  });

  it('includes skill proficiencies when policy allows', () => {
    const system = getSystemRuleset(DEFAULT_SYSTEM_RULESET_ID);
    const catalog = buildCampaignCatalog(systemCatalog, {}, system);
    expect(catalog.skillProficienciesById['stealth']).toBeDefined();
    expect(catalog.skillProficiencyIds?.length).toBeGreaterThan(0);
  });
});
