/**
 * Merge a SystemRuleset (code defaults) with a CampaignRulesetPatch
 * (DB-stored delta) into a fully-formed Ruleset.
 *
 * Shallow-merges at each nesting level down to
 * mechanics.progression.multiclassing.default, then performs a keyed-map
 * merge for entryRequirementsByTargetClass so system keys and campaign
 * keys coexist (campaign wins on collision).
 */
import type { SystemRuleset, CampaignRulesetPatch } from '../types/ruleset.types';
import type {
  Ruleset,
  RulesetContent,
  MechanicsRules,
  Progression,
  MulticlassingRules,
  MulticlassingRuleSet,
  ClassId,
  ClassEntryRequirement,
} from '@/shared/types/ruleset';

export function resolveCampaignRuleset(
  system: SystemRuleset,
  patch: CampaignRulesetPatch,
): Ruleset {
  const sMcDefault = system.mechanics.progression.multiclassing.default;
  const pMc = patch.mechanics?.progression?.multiclassing;
  const pMcDefault = pMc?.default;

  const mergedEntryReqs: Record<ClassId, ClassEntryRequirement> = {
    ...(sMcDefault.entryRequirementsByTargetClass ?? {}),
    ...((pMcDefault?.entryRequirementsByTargetClass ?? {}) as Record<ClassId, ClassEntryRequirement>),
  };

  const mergedMcDefault: MulticlassingRuleSet = {
    ...sMcDefault,
    ...((pMcDefault ?? {}) as Partial<MulticlassingRuleSet>),
    entryRequirementsByTargetClass: Object.keys(mergedEntryReqs).length > 0
      ? mergedEntryReqs
      : undefined,
  };

  const sMc = system.mechanics.progression.multiclassing;
  const mergedMc: MulticlassingRules = {
    ...sMc,
    ...((pMc ?? {}) as Partial<MulticlassingRules>),
    default: mergedMcDefault,
  };

  const sProg = system.mechanics.progression;
  const mergedProg: Progression = {
    ...sProg,
    ...((patch.mechanics?.progression ?? {}) as Partial<Progression>),
    multiclassing: mergedMc,
  };

  const mergedMechanics: MechanicsRules = {
    ...system.mechanics,
    ...((patch.mechanics ?? {}) as Partial<MechanicsRules>),
    progression: mergedProg,
  };

  return {
    _id: patch._id,
    campaignId: patch.campaignId,
    meta: { ...system.meta, ...(patch.meta ?? {}) } as Ruleset['meta'],
    content: { ...system.content, ...(patch.content ?? {}) } as RulesetContent,
    mechanics: mergedMechanics,
  };
}
