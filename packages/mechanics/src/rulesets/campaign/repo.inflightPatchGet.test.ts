import { describe, expect, it, vi } from 'vitest';
import type { CampaignRulesetPatch } from '../types/ruleset.types';
import type { Ruleset as SharedRuleset } from '@/shared/types/ruleset';

const apiFetchMock = vi.fn<(url: string) => Promise<unknown>>();

vi.mock('@/app/api', () => ({
  apiFetch: (url: string) => apiFetchMock(url),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('../system/catalog', () => ({
  getSystemRuleset: (_id: string): SharedRuleset =>
    ({
      _id: _id,
      mechanics: {},
    }) as unknown as SharedRuleset,
}));

vi.mock('./patch/normalize', () => ({
  normalizeCampaignRulesetPatch: (p: CampaignRulesetPatch) => p,
}));

vi.mock('./patch/validate', () => ({
  validateCampaignRulesetPatch: () => ({ ok: true as const }),
}));

vi.mock('../resolve/ruleset', () => ({
  resolveCampaignRuleset: (system: unknown, patch: unknown) => ({ system, patch }),
}));

describe('getCampaignRulesetPatch concurrent dedupe', () => {
  it('runs a single GET when multiple callers request the same campaign in parallel', async () => {
    const patchDto: CampaignRulesetPatch = {
      _id: 'p',
      campaignId: 'c1',
      systemId: 'SRD_CC_v5_2_1',
    };

    apiFetchMock.mockResolvedValue({ patch: patchDto });

    const { getCampaignRulesetPatch } = await import('./repo');

    await Promise.all([getCampaignRulesetPatch('c1'), getCampaignRulesetPatch('c1')]);

    const rulesetCalls = apiFetchMock.mock.calls.filter(([u]) =>
      String(u).includes('/ruleset-patch'),
    );
    expect(rulesetCalls.length).toBe(1);
  });
});
