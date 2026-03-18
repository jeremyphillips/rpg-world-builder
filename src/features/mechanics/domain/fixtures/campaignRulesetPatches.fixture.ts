import type { CampaignRulesetPatch } from '@/features/mechanics/domain/rulesets/types/ruleset.types';

export const CAMPAIGN_RULESET_PATCHES_FIXTURE: CampaignRulesetPatch[] = [
  {
    _id: 'testruleset01',
    campaignId: '698a7c82c35d1758cfa4f4c3',
    systemId: 'SRD_CC_v5_2_1',
    meta: {
      name: 'Lankhmar 5e Ruleset',
      campaignTags: { selected: [], allowCustom: true, custom: [] },
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
              wizard: { anyOf: [{ all: [{ ability: 'intelligence', min: 18 }] }] },
            },
          },
        },
      },
    },
  },
];