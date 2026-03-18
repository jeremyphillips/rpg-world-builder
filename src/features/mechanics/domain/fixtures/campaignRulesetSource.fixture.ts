import type { CampaignRulesetSource } from '@/features/mechanics/domain/rulesets/campaign/registry';
import { CAMPAIGN_RULESET_PATCHES_FIXTURE } from './campaignRulesetPatches.fixture';

export const fixtureCampaignRulesetSource: CampaignRulesetSource = {
  listPatches: () => CAMPAIGN_RULESET_PATCHES_FIXTURE,
};
