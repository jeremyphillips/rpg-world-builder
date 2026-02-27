import type { Ruleset, DeepPartial } from '@/data/ruleSets/ruleSets.types';

export type SystemRulesetId = string;

export type SystemRuleset = Omit<Ruleset, '_id' | 'campaignId'> & {
  systemId: SystemRulesetId;
};

export type CampaignRulesetPatch = {
  _id: string;
  campaignId: string;
  systemId: SystemRulesetId;
} & DeepPartial<Omit<Ruleset, '_id' | 'campaignId'>>;

export type ResolvedCampaignRuleset = Ruleset;
