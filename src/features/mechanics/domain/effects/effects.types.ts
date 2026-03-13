import type { Condition } from '../conditions/condition.types';
import type { TriggerType } from '../triggers/trigger.types';
import type { StatTarget } from '../resolution/stat-resolver';
import type { FormulaEffect } from '../resolution/formula.engine';
import type { DiceOrFlat } from '../dice/dice.types';
import type { AbilityKey, AbilityRef } from '../core/character';
import type { EffectDuration } from './timing.types';

export type { FormulaDefinition, FormulaEffect } from '../resolution/formula.engine';

export type ScalingRule = {};

export type ResourceCost = {
  resource: string;
  amount: number;
};

export type ActivationKind = 'action' | 'bonus_action' | 'reaction' | 'special';
export type SaveDcSpec = number | { kind: '5-plus-damage-taken' };

export type EffectMode = 'add' | 'set' | 'multiply';

/**
 * Shared optional metadata for every effect.
 * - `text` is a human-readable fallback/summary (UI + AI assist).
 * - structured fields remain the source of truth.
 */
export type EffectMeta = {
  text?: string;
  source?: string;
  condition?: Condition;
  duration?: EffectDuration;
  priority?: number;
};

export type EffectBase<K extends string> = EffectMeta & { kind: K };

/** Temporary escape hatch for unknown/edition-specific effects. */
export type CustomEffect = EffectBase<'custom'> & {
  id: string;
  params?: Record<string, unknown>;
};

export type BonusEffect = EffectBase<'bonus'> & {
  target: StatTarget;
  value: number;
};

// TODO: split into variants.
export type ModifierValue =
  | number
  | 'cold'
  | 'fire'
  | 'poison'
  | 'necrotic'
  | 'radiant'
  | 'thunder'
  | 'lightning'
  | 'psychic'
  | 'force'
  | {
      ability?: AbilityKey;
      perLevel?: number;
      dice?: DiceOrFlat;
      type?:
        | 'cold'
        | 'fire'
        | 'poison'
        | 'necrotic'
        | 'radiant'
        | 'thunder'
        | 'lightning'
        | 'psychic'
        | 'force';
    };

export type ModifierEffect = EffectBase<'modifier'> & {
  target: StatTarget;
  mode: EffectMode;
  value: ModifierValue;
};

export type ProficiencyGrantValue = {
  target: 'armor' | 'weapon' | 'tool' | 'skill' | 'saving_throw';
  categories?: string[];
  items?: string[];
};

export type GrantEffect = EffectBase<'grant'> & {
  grantType: 'proficiency' | 'action' | 'spell' | 'condition_immunity';
  value: ProficiencyGrantValue[] | unknown;
};

export type ResourceEffect = EffectBase<'resource'> & {
  resource: {
    id: string;
    max: number | ScalingRule;
    recharge: 'short_rest' | 'long_rest' | 'none';
    dice?: DiceOrFlat;
  };
};

export type TriggeredEffect = EffectBase<'trigger'> & {
  trigger: TriggerType;
  effects: Effect[];
  cost?: ResourceCost;
};

export type SaveEffect = EffectBase<'save'> & {
  save: {
    ability: AbilityRef;
    dc?: SaveDcSpec;
  };
  onFail: Effect[];
  onSuccess?: Effect[];
};

export type ConditionEffect = EffectBase<'condition'> & {
  conditionId: string;
  targetSizeMax?: string;
  escapeDc?: number;
  escapeCheckDisadvantage?: boolean;
};

export type ActivationEffect = EffectBase<'activation'> & {
  activation: ActivationKind;
  effects: Effect[];
  cost?: ResourceCost;
};

export type DamageEffect = EffectBase<'damage'> & {
  damage: DiceOrFlat;
  damageType?: string;
};

export type RollModifierEffect = EffectBase<'roll_modifier'> & {
  appliesTo: string | string[];
  modifier: 'advantage' | 'disadvantage';
};

export type StateEffect = EffectBase<'state'> & {
  stateId: string;
  targetSizeMax?: string;
  escape?: {
    dc: number;
    ability?: AbilityRef;
    skill?: string;
    actionRequired?: boolean;
  };
  ongoingEffects?: Effect[];
  notes?: string;
};

export type TargetingEffect = EffectBase<'targeting'> & {
  target: 'one-creature' | 'creatures-in-area' | 'creatures-entered-during-move';
  targetType?: 'creature';
  rangeFeet?: number;
  requiresSight?: boolean;
  area?: {
    kind: 'cone' | 'sphere' | 'line' | 'square' | 'cylinder' | 'cube';
    size: number;
  };
};

export type IntervalEffect = EffectBase<'interval'> & {
  stateId: string;
  every: {
    value: number;
    unit: 'turn' | 'round' | 'minute' | 'hour' | 'day';
  };
  effects: Effect[];
};

export type ImmunityEffect = EffectBase<'immunity'> & {
  scope: 'source-action';
  duration: EffectDuration;
  notes?: string;
};

export type DeathOutcomeEffect = EffectBase<'death_outcome'> & {
  trigger: 'reduced-to-0-hit-points-by-this-action';
  targetType?: 'creature';
  outcome: 'turns-to-dust';
};

export type HoldBreathEffect = EffectBase<'hold_breath'> & {
  duration: EffectDuration;
};

export type TrackedPartEffect = EffectBase<'tracked_part'> & {
  part: 'head' | 'limb';
  initialCount: number;
  loss?: {
    trigger: 'damage_taken_in_single_turn';
    minDamage: number;
    count: number;
  };
  deathWhenCountReaches?: number;
  regrowth?: {
    trigger: 'turn_end';
    requiresLivingPart?: boolean;
    countPerPartLostSinceLastTurn: number;
    suppressedByDamageTypes?: string[];
    healHitPoints?: number;
  };
};

export type ExtraReactionEffect = EffectBase<'extra_reaction'> & {
  appliesTo: 'opportunity-attacks-only';
  count: {
    kind: 'per-part-beyond';
    part: 'head' | 'limb';
    baseline: number;
  };
};

export type MoveEffect = EffectBase<'move'> & {
  distance?: number;
  forced?: boolean;
  toNearestUnoccupiedSpace?: boolean;
  withinFeetOfSource?: number;
  failIfNoSpace?: boolean;
  movesWithSource?: boolean;
  ignoresExtraCostForGrappledCreature?: boolean;
};

export type ActionEffect = EffectBase<'action'> & {
  action: string;
};

export type FormEffect = EffectBase<'form'> & {
  form: 'true-form' | 'object';
  allowedSizes?: string[];
  canReturnToTrueForm?: boolean;
  retainsStatistics?: boolean;
  equipmentTransforms?: boolean;
  notes?: string;
};

export type SpawnEffect = EffectBase<'spawn'> & {
  creature: string;
  count: number;
  location: 'self-space' | 'self-cell';
  actsWhen: 'immediately-after-source-turn';
};

export type HitPointsEffect = EffectBase<'hit_points'> & {
  mode: 'heal' | 'damage';
  value: number;
};

export type AuraEffect = EffectBase<'aura'> & {
  range: number;
  affects: 'allies' | 'enemies' | 'self';
  effects: Effect[];
};

export type NoteEffect = EffectBase<'note'> & {
  // For notes, text is the payload, so require it.
  text: string;
};

export type Effect =
  | BonusEffect
  | ModifierEffect
  | FormulaEffect
  | GrantEffect
  | ResourceEffect
  | TriggeredEffect
  | SaveEffect
  | ConditionEffect
  | ActivationEffect
  | DamageEffect
  | RollModifierEffect
  | StateEffect
  | TargetingEffect
  | IntervalEffect
  | ImmunityEffect
  | DeathOutcomeEffect
  | HoldBreathEffect
  | TrackedPartEffect
  | ExtraReactionEffect
  | MoveEffect
  | ActionEffect
  | FormEffect
  | SpawnEffect
  | HitPointsEffect
  | AuraEffect
  | NoteEffect
  | CustomEffect;