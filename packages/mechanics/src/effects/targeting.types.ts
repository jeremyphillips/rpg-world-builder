import type {
  TargetEligibilityKind,
  TargetSelectionKind,
} from '@/features/content/shared/domain/vocab/spellTargeting.vocab';

/**
 * Monster special actions that use the same selection/eligibility axes as spell AoE / movement triggers,
 * limited to area-style selection on creatures.
 */
export type MonsterSpecialActionTarget = {
  selection: Extract<TargetSelectionKind, 'in-area' | 'entered-during-move'>;
  targetType: Extract<TargetEligibilityKind, 'creature'>;
};
