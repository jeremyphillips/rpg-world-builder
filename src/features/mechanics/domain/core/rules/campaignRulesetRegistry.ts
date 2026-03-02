import type { Ruleset } from '@/shared/types';
import type { CampaignRulesetPatch } from './ruleset.types';
import { getSystemRuleset } from './systemCatalog';
import { resolveCampaignRuleset } from './resolveCampaignRuleset';
import { normalizeCampaignRulesetPatch } from './normalizeCampaignRulesetPatch';
import { validateCampaignRulesetPatch } from './validateCampaignRulesetPatch';

export type CampaignRulesetSource = {
  listPatches: () => CampaignRulesetPatch[];
};

export function resolvePatchesToRulesets(source: CampaignRulesetSource): {
  ruleSets: Ruleset[];
  ruleSetsById: Record<string, Ruleset>;
} {
  const patches = source.listPatches();

  const ruleSets = patches.map(raw => {
    const system = getSystemRuleset(raw.systemId);
    const patch = normalizeCampaignRulesetPatch(raw);

    if (import.meta.env.DEV) {
      const result = validateCampaignRulesetPatch(patch, system);
      if (!result.ok) {
        console.warn(`[ruleset] Validation errors for patch "${patch._id}":`, result.errors);
      }
    }

    return resolveCampaignRuleset(system, patch);
  });

  const ruleSetsById: Record<string, Ruleset> = Object.fromEntries(ruleSets.map(r => [r._id, r]));

  return { ruleSets, ruleSetsById };
}