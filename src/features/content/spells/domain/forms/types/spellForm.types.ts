/**
 * Shared form types for Spell Create/Edit forms.
 * Flat UI fields; assembly builds SpellInput nested objects.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type { MagicSchool } from '@/features/content/shared/domain/vocab';
import type { EffectConditionId } from '@/features/content/shared/domain/vocab/effectConditions.vocab';
import type {
  TargetEligibilityKind,
  TargetSelectionKind,
} from '@/features/content/shared/domain/vocab/spellTargeting.vocab';
import type { ResourceRechargeKind } from '@/features/content/shared/domain/vocab/resourceRecharge.vocab';
import type { ClassId } from '@/shared/types/ruleset';
import type { SpellEffectPhase1Kind } from '../options/spellEffectKinds.phase1';

/**
 * One nested `effects[]` row — flat draft keys + `kind` (Phase 1 spell picker is narrower than global authorable).
 */
export type SpellEffectFormRow = {
  kind: SpellEffectPhase1Kind | '';
  noteText: string;
  /** Reserved if we wire `EffectNoteCategory` later */
  noteCategory: string;
  /** Damage effect — UI mode; only one branch is assembled to the domain payload. */
  damageFormat: 'dice' | 'flat' | '';
  damageDiceCount: string;
  /** Die face id string (see `DIE_FACE_OPTIONS` values in shared dice module). */
  damageDieFace: string;
  /** Signed integer as string, e.g. `2` or `-1`; empty = no modifier */
  damageModifier: string;
  damageFlatValue: string;
  damageType: string;
  conditionId: EffectConditionId | '';
  moveDistance: string;
  moveForced: boolean;
  resourceId: string;
  resourceMax: string;
  resourceRecharge: ResourceRechargeKind;
};

/** Prototype authoring row; maps to domain `effectGroups` via mapper. */
export type SpellEffectGroupFormRow = {
  targeting: {
    selection: TargetSelectionKind | '';
    targetType: TargetEligibilityKind | '';
  };
  effects: SpellEffectFormRow[];
};

export type SpellFormValues = Omit<ContentFormValues, 'description'> & {
  descriptionFull: string;
  descriptionSummary: string;
  school: MagicSchool | '';
  level: string;
  classes: ClassId[];
  effectGroups: SpellEffectGroupFormRow[];

  castingTimeUnit: string;
  /** Used when unit is minute or hour */
  castingTimeValue: string;
  castingTimeCanRitual: boolean;
  /** When unit is reaction — trigger id from TRIGGER_DEFINITIONS */
  castingTimeTrigger: string;

  durationKind: string;
  durationTimedValue: string;
  durationTimedUnit: string;
  durationTimedUpTo: boolean;
  /** Concentration for timed / special / until-* / turn-boundary (not instantaneous). */
  durationConcentration: boolean;
  durationSpecialText: string;
  durationUntilTriggeredText: string;
  durationTurnBoundarySubject: string;
  durationTurnBoundaryTurn: string;
  durationTurnBoundaryBoundary: string;

  rangeKind: string;
  rangeDistanceValue: string;
  rangeDistanceUnit: string;
  rangeSpecialDescription: string;

  /** Spell component ids: verbal, somatic, material */
  componentIds: string[];
  materialDescription: string;
  materialCostValue: string;
  materialCostUnit: string;
  materialConsumed: boolean;
};
