/**
 * Resolves ruleset + merged catalog for a campaign (mirrors client CampaignRulesProvider
 * catalog build). Use for server-side validation (e.g. spell class ids vs allowed classes).
 */
import { createDefaultCampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/campaign/repo';
import { loadCampaignCatalogOverrides } from '@/features/mechanics/domain/rulesets/campaign/patch/loadOverrides';
import {
  buildCampaignCatalog,
  type CampaignCatalogAdmin,
} from '@/features/mechanics/domain/rulesets/campaign/buildCatalog';
import { assertSystemRulesetId } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { normalizeCampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/campaign/patch/normalize';
import { resolveCampaignRuleset } from '@/features/mechanics/domain/rulesets/resolve/ruleset';
import { getSystemRuleset, systemCatalog } from '@/features/mechanics/domain/rulesets/system/catalog';
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/types/ruleset.types';
import type { Ruleset } from '@/shared/types/ruleset';

import { getPatchByCampaignId } from './rulesetPatch.service';

export async function resolveCampaignCatalogForCampaign(
  campaignId: string,
): Promise<{ ruleset: Ruleset; catalog: CampaignCatalogAdmin }> {
  const patchDoc = await getPatchByCampaignId(campaignId);
  const rawPatch: CampaignRulesetPatch = patchDoc
    ? (patchDoc as unknown as CampaignRulesetPatch)
    : createDefaultCampaignRulesetPatch(campaignId);

  assertSystemRulesetId(rawPatch.systemId);
  const system = getSystemRuleset(rawPatch.systemId);
  const normalized = normalizeCampaignRulesetPatch(rawPatch);
  const ruleset = resolveCampaignRuleset(system, normalized);

  const overrides = await loadCampaignCatalogOverrides(campaignId);
  const catalog = buildCampaignCatalog(systemCatalog, overrides, ruleset);
  return { ruleset, catalog };
}
