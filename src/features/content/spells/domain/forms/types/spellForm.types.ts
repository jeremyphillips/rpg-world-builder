/**
 * Shared form types for Spell Create/Edit forms.
 * Flat UI fields; assembly builds SpellInput nested objects.
 */
import type { ContentFormValues } from '@/features/content/shared/domain/types';
import type { MagicSchool } from '@/features/content/shared/domain/vocab';
import type {
  TargetEligibilityKind,
  TargetSelectionKind,
} from '@/features/content/shared/domain/vocab/spellTargeting.vocab';
import type { ClassId } from '@/shared/types/ruleset';

/** Prototype authoring row; maps to domain `effectGroups` via mapper (minimal effect payloads). */
export type SpellEffectGroupFormRow = {
  targeting: {
    selection: TargetSelectionKind | '';
    targetType: TargetEligibilityKind | '';
  };
  effects: { kind: 'damage' | 'condition' | '' }[];
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
