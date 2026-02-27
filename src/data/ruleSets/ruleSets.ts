/**
 * Campaign rulesets — simulated DB records + assembly.
 *
 * Each entry in CAMPAIGN_RULESET_PATCHES represents a campaign-owned
 * ruleset document that stores only deltas from a system ruleset.
 * The final `ruleSets` export is produced by resolving each patch
 * against its system defaults via `resolveCampaignRuleset()`.
 *
 * Types are defined in `./ruleSets.types.ts` and re-exported here
 * for backward-compatible import paths.
 */

// Re-export all types so `@/data/ruleSets` import paths keep working
export * from './ruleSets.types';

import type { CampaignTagsState, CampaignTagsOptions, CampaignTagsVM, Ruleset } from './ruleSets.types';
import type { CampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/ruleset.types';
import { getSystemRuleset } from '@/features/mechanics/domain/core/rules/systemCatalog';
import { resolveCampaignRuleset } from '@/features/mechanics/domain/core/rules/resolveCampaignRuleset';
import { normalizeCampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/normalizeCampaignRulesetPatch';
import { validateCampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/validateCampaignRulesetPatch';

// Re-export startingWealthTiersDefault from its new home (system catalog)
export { startingWealthTiersDefault } from '@/features/mechanics/domain/core/rules/systemCatalog';

// Re-export CampaignRulesetPatch so existing consumers can reach it
export type { CampaignRulesetPatch } from '@/features/mechanics/domain/core/rules/ruleset.types';

// ---------------------------------------------------------------------------
// Campaign tag VM helper
// ---------------------------------------------------------------------------

export const toCampaignTagsVM = (
  state: CampaignTagsState | undefined,
  options: CampaignTagsOptions,
): CampaignTagsVM => ({
  selected: state?.selected ?? [],
  allowCustom: state?.allowCustom ?? true,
  custom: state?.custom ?? [],
  options,
});

// ---------------------------------------------------------------------------
// Simulated DB records — campaign-specific patches
// ---------------------------------------------------------------------------

const CAMPAIGN_RULESET_PATCHES: CampaignRulesetPatch[] = [
  {
    _id: 'testruleset01',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    systemId: '5e_v1',
    meta: {
      name: 'Lankhmar 5e Ruleset',
      campaignTags: {
        selected: [],
        allowCustom: true,
        custom: [],
      },
    },
    content: {
      classes: { policy: 'all_except', ids: ['warlock'] },
      races: { policy: 'only', ids: ['human'] },
    },
    mechanics: {
      progression: {
        multiclassing: {
          default: {
            entryRequirementsByTargetClass: {
              wizard: {
                anyOf: [{ all: [{ ability: 'intelligence', min: 18 }] }],
              },
            },
          },
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Resolved rulesets
// ---------------------------------------------------------------------------

function resolvePatches(patches: CampaignRulesetPatch[]): Ruleset[] {
  return patches.map(raw => {
    const system = getSystemRuleset(raw.systemId);
    const patch = normalizeCampaignRulesetPatch(raw);

    if (import.meta.env.DEV) {
      const result = validateCampaignRulesetPatch(patch, system);
      if (!result.ok) {
        console.warn(
          `[ruleset] Validation errors for patch "${patch._id}":`,
          result.errors,
        );
      }
    }

    return resolveCampaignRuleset(system, patch);
  });
}

export const ruleSets: Ruleset[] = resolvePatches(CAMPAIGN_RULESET_PATCHES);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const ruleSetsById: Record<string, Ruleset> = Object.fromEntries(
  ruleSets.map(r => [r._id, r]),
);

export const defaultRulesetId = 'testruleset01';

export const defaultRuleset: Ruleset = ruleSetsById[defaultRulesetId];
