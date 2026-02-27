/**
 * Resolve a campaign's ruleset and build a filtered CampaignCatalog.
 *
 * Safe to call with any campaign — falls back to the default ruleset
 * when rulesetId is missing or unrecognised.
 */
import type { Campaign } from '@/shared/types/campaign.types'
import type { Ruleset } from '@/data/ruleSets'
import { ruleSetsById, defaultRuleset } from '@/data/ruleSets'
import { systemCatalog, type CampaignCatalog } from './systemCatalog'
import { buildCampaignCatalog } from './buildCampaignCatalog'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type CampaignRulesContext = {
  ruleset: Ruleset
  catalog: CampaignCatalog
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export function resolveCampaignRulesContext(
  campaign: Campaign | null | undefined,
): CampaignRulesContext {
  const ruleset =
    (campaign?.rulesetId ? ruleSetsById[campaign.rulesetId] : undefined)
    ?? defaultRuleset

  const catalog = buildCampaignCatalog(systemCatalog, {}, ruleset)

  return { ruleset, catalog }
}
