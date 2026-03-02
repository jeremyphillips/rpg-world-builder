import type { Ruleset, DeepPartial } from '@/shared/types'
import { SYSTEM_RULESET_IDS } from './systemIds';

export type SystemRulesetId = (typeof SYSTEM_RULESET_IDS)[number];

export type SystemRuleset = Omit<Ruleset, '_id' | 'campaignId'> & {
  systemId: SystemRulesetId;
  meta: Ruleset['meta'] & {
    license?: 'CC-BY-4.0';
    source?: 'SRD';
    srdVersion?: '5.2.1';
  };
};

export type CampaignRulesetPatch = {
  _id: string;
  campaignId: string;
  systemId: SystemRulesetId;
} & DeepPartial<Omit<Ruleset, '_id' | 'campaignId'>>;

export type ResolvedCampaignRuleset = Ruleset;

export type RulesetLike = Pick<Ruleset, 'meta' | 'content' | 'mechanics'>;