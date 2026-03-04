import type { MulticlassingRules } from '@/shared/types/ruleset';
import type { AbilityRequirementGroup, RequirementExpr } from '@/features/classes/domain/types';
import type { AbilityScoreMapResolved } from '@/features/mechanics/domain/core/character/abilities.types';
import type { AbilityScoreValue } from '@/features/mechanics/domain/core/character/abilities.types';
import { classes } from '@/data/classes';
import { resolveRule, type RuleResolveContext } from '@/features/mechanics/domain/core/rules';
import { ABILITY_KEYS } from '@/features/mechanics/domain/core/character';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface CanMulticlassResult {
  allowed: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Completeness check
// ---------------------------------------------------------------------------

function areAbilityScoresComplete(scores: AbilityScoreMapResolved | undefined): boolean {
  if (!scores) return false;
  return ABILITY_KEYS.every(k => {
    const v = scores[k];
    return typeof v === 'number' && Number.isFinite(v);
  });
}

// ---------------------------------------------------------------------------
// Requirement helpers
// ---------------------------------------------------------------------------

type EffectiveRequirement = { anyOf: AbilityRequirementGroup[]; note?: string };

function meetsRequirementGroup(
  group: AbilityRequirementGroup,
  scores: AbilityScoreMapResolved,
): boolean {
  return group.all.every(req => ((scores[req.ability] as AbilityScoreValue) ?? 0) >= req.min);
}

function meetsRequirement(
  req: EffectiveRequirement,
  scores: AbilityScoreMapResolved,
): boolean {
  if (req.anyOf.length === 0) return false;
  return req.anyOf.some(group => meetsRequirementGroup(group, scores));
}

function formatAbilityName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

function formatRequirement(req: EffectiveRequirement): string {
  if (req.note) return req.note;

  const groupLabels = req.anyOf.map(group =>
    group.all.map(r => `${formatAbilityName(r.ability)} ${r.min}+`).join(' and '),
  );

  if (groupLabels.length === 1) return `Requires ${groupLabels[0]}`;
  return `Requires ${groupLabels.join('; or ')}`;
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

/**
 * Determines whether a character can add another class.
 *
 * Resolves the multiclassing RuleConfig against the given context so
 * per-class / per-race overrides take effect automatically.
 *
 * Checks (in order, first failure wins):
 *   1. Campaign enables multiclassing
 *   2. Character meets minimum level
 *   3. Ability scores complete
 *   4. Current-class exit requirements (must meet own class's prereqs)
 *   5. Target-class entry requirements
 *   6. Character hasn't hit the class cap
 *   7. Remaining levels available
 */
export const canAddClass = (
  multiclassingConfig: MulticlassingRules,
  context: RuleResolveContext,
  currentClasses: number,
  remainingLevels: number,
  characterLevel: number,
  targetClassId?: string,
  abilityScores?: AbilityScoreMapResolved,
): CanMulticlassResult => {
  const rules = resolveRule(multiclassingConfig, context);

  if (!rules.enabled) {
    return { allowed: false, reason: 'Campaign does not support multiclassing' };
  }

  if (rules.minLevelToMulticlass != null && characterLevel < rules.minLevelToMulticlass) {
    return {
      allowed: false,
      reason: `Requires level ${rules.minLevelToMulticlass} to multiclass`,
    };
  }

  if (!areAbilityScoresComplete(abilityScores)) {
    return { allowed: false, reason: 'Set ability scores before adding a class' };
  }

  // Current-class exit requirements: in 5e you must meet your own class's
  // multiclassing prerequisites to leave it.
  if (context.classId && abilityScores) {
    const currentClassData = classes.find(c => c.id === context.classId);
    const classExitReq: RequirementExpr | undefined = currentClassData?.requirements?.multiclassing;
    const rulesetExitReq = rules.entryRequirementsByTargetClass?.[context.classId];
    const exitReq: EffectiveRequirement | undefined = rulesetExitReq ?? classExitReq;

    if (exitReq && exitReq.anyOf.length > 0 && !meetsRequirement(exitReq, abilityScores)) {
      return { allowed: false, reason: formatRequirement(exitReq) };
    }
  }

  if (targetClassId && abilityScores) {
    const classData = classes.find(c => c.id === targetClassId);
    const classReq: RequirementExpr | undefined = classData?.requirements?.multiclassing;

    const rulesetReq = rules.entryRequirementsByTargetClass?.[targetClassId];
    const effective: EffectiveRequirement | undefined = rulesetReq ?? classReq;

    if (effective) {
      if (effective.anyOf.length === 0) {
        return { allowed: false, reason: 'No valid multiclass requirement options defined' };
      }

      if (!meetsRequirement(effective, abilityScores)) {
        return { allowed: false, reason: formatRequirement(effective) };
      }
    }
  }

  if (rules.maxClasses != null && currentClasses >= rules.maxClasses) {
    return {
      allowed: false,
      reason: `Campaign allows a maximum of ${rules.maxClasses} classes`,
    };
  }

  if (remainingLevels <= 0) {
    return { allowed: false, reason: 'No remaining levels to allocate' };
  }

  return { allowed: true };
};
