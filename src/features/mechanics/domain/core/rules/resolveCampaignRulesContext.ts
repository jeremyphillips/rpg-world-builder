import type { Campaign } from '@/shared/types/campaign.types';
import type { Ruleset } from '@/shared/types/ruleset';
import { getSystemRuleset, systemCatalog } from './systemCatalog';
import { buildCampaignCatalog, type CampaignCatalogAdmin } from './buildCampaignCatalog';
import type { SystemRulesetId } from './ruleset.types';
import type { RulesetLike } from './ruleset.types';
import { DEFAULT_SYSTEM_RULESET_ID } from './systemIds';

export type CampaignRulesContext = {
  ruleset: RulesetLike;
  catalog: CampaignCatalogAdmin;
  /** True when viewer can manage campaign content (DM/owner). Used to gate useCampaignCatalogAdmin. */
  canManage: boolean;
};

export function resolveCampaignRulesContext({
  ruleset,
  fallbackSystemId = DEFAULT_SYSTEM_RULESET_ID,
  canManage = false,
}: {
  campaign?: Campaign | null;
  ruleset?: Ruleset | null;
  fallbackSystemId?: SystemRulesetId;
  canManage?: boolean;
}): CampaignRulesContext {
  const resolvedRuleset: RulesetLike = ruleset ?? getSystemRuleset(fallbackSystemId);

  const catalog = buildCampaignCatalog(systemCatalog, {}, resolvedRuleset);

  return { ruleset: resolvedRuleset, catalog, canManage };
}