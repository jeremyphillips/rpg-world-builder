import type { Campaign } from '@/shared/types/campaign.types';
import type { Ruleset } from '@/shared/types';
import { getSystemRuleset, systemCatalog, type CampaignCatalog } from './systemCatalog';
import { buildCampaignCatalog } from './buildCampaignCatalog';
import type { SystemRulesetId } from './ruleset.types';
import type { RulesetLike } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

export type CampaignRulesContext = {
  ruleset: RulesetLike;
  catalog: CampaignCatalog;
};

export function resolveCampaignRulesContext({
  ruleset,
  fallbackSystemId = DEFAULT_SYSTEM_RULESET_ID,
}: {
  campaign?: Campaign | null;
  ruleset?: Ruleset | null;
  fallbackSystemId?: SystemRulesetId;
}): CampaignRulesContext {
  const resolvedRuleset: RulesetLike = ruleset ?? getSystemRuleset(fallbackSystemId);

  const catalog = buildCampaignCatalog(systemCatalog, {}, resolvedRuleset);

  return { ruleset: resolvedRuleset, catalog };
}