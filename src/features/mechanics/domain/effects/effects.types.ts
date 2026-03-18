import type { Condition } from '../conditions/condition.types';
import type { TriggerType } from '../triggers/trigger.types';
import type { StatTarget } from '../resolution/resolvers/stat-resolver';
import type { FormulaEffect } from '../resolution/engines/formula.engine';
import type { DiceOrFlat } from '../dice/dice.types';
import type { AbilityKey, AbilityRef } from '../character';
import type { EffectDuration } from './timing.types';
import type { WeaponDamageType } from '@/features/content/equipment/weapons/domain/vocab';
import type { MonsterSizeCategory } from '@/features/content/monsters/domain/vocab/monster.vocab';

export type { FormulaDefinition, FormulaEffect } from '../resolution/engines/formula.engine';

export type ScalingRule = {};

export type ResourceCost = {
  resource: string;
  amount: number;
};

export type ActivationKind = 'action' | 'bonus-action' | 'reaction' | 'special';
export type SaveDcSpec = number | { kind: '5-plus-damage-taken' };

export type EffectMode = 'add' | 'set' | 'multiply';

export type EffectConditionId =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

export type ConditionImmunityId = EffectConditionId | 'exhaustion';
export type EffectDamageType = WeaponDamageType | 'acid' | DamageTypeModifierValue;
export type EffectSizeCategory = MonsterSizeCategory;

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

export type DamageTypeModifierValue =
  | 'cold'
  | 'fire'
  | 'poison'
  | 'necrotic'
  | 'radiant'
  | 'thunder'
  | 'lightning'
  | 'psychic'
  | 'force';

export type AbilityModifierValue = {
  ability: AbilityKey;
  perLevel?: never;
  dice?: never;
  type?: never;
};

export type PerLevelModifierValue = {
  perLevel: number;
  ability?: never;
  dice?: never;
  type?: never;
};

export type DiceModifierValue = {
  dice: DiceOrFlat;
  type?: DamageTypeModifierValue;
  ability?: never;
  perLevel?: never;
};

export type ModifierValue =
  | number
  | DamageTypeModifierValue
  | AbilityModifierValue
  | PerLevelModifierValue
  | DiceModifierValue;

export type ModifierEffect = EffectBase<'modifier'> & {
  target: StatTarget;
  mode: EffectMode;
  value: ModifierValue;
};

export type ProficiencyGrantValue = {
  target: 'armor' | 'weapon' | 'tool' | 'skill' | 'saving-throw';
  categories?: string[];
  items?: string[];
};

export type ProficiencyGrantEffect = EffectBase<'grant'> & {
  grantType: 'proficiency';
  value: ProficiencyGrantValue[];
};

export type ConditionImmunityGrantEffect = EffectBase<'grant'> & {
  grantType: 'condition-immunity';
  value: ConditionImmunityId;
};

export type GrantEffect = ProficiencyGrantEffect | ConditionImmunityGrantEffect;

export type ResourceEffect = EffectBase<'resource'> & {
  resource: {
    id: string;
    max: number | ScalingRule;
    recharge: 'short-rest' | 'long-rest' | 'none';
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

export type CheckEffect = EffectBase<'check'> & {
  name?: string;
  actor: 'nearby-creature';
  distanceFeet?: number;
  actionRequired?: boolean;
  check: {
    ability: AbilityRef;
    skill?: string;
    dc: number;
  };
  target?: 'creature-inside' | 'object-inside';
  onSuccess?: Effect[];
  onFail?: Effect[];
};

export type ConditionEffect = EffectBase<'condition'> & {
  conditionId: EffectConditionId;
  targetSizeMax?: EffectSizeCategory;
  escapeDc?: number;
  escapeCheckDisadvantage?: boolean;
};

export type ActivationEffect = EffectBase<'activation'> & {
  activation: ActivationKind;
  effects: Effect[];
  cost?: ResourceCost;
};

export type DamageLevelThreshold = {
  level: number;
  damage?: DiceOrFlat;
  instances?: number;
};

export type DamageEffect = EffectBase<'damage'> & {
  damage: DiceOrFlat;
  damageType?: EffectDamageType;
  levelScaling?: {
    thresholds: DamageLevelThreshold[];
  };
  instances?: {
    count: number;
    simultaneous?: boolean;
    canSplitTargets?: boolean;
    canStackOnSingleTarget?: boolean;
  };
};

export type RollModifierEffect = EffectBase<'roll-modifier'> & {
  appliesTo: string | string[];
  modifier: 'advantage' | 'disadvantage';
};

export type ContainmentEffect = EffectBase<'containment'> & {
  fillsEntireSpace?: boolean;
  canContainCreatures?: boolean;
  creatureCover?: 'total-cover';
  capacity?: {
    large?: number;
    mediumOrSmall?: number;
  };
};

export type VisibilityRuleEffect = EffectBase<'visibility-rule'> & {
  transparent?: boolean;
  noticeCheck?: {
    ability: AbilityRef;
    skill?: string;
    dc: number;
    unlessWitnessedMoveOrAction?: boolean;
  };
};

export type StateEffect = EffectBase<'state'> & {
  stateId: string;
  targetSizeMax?: EffectSizeCategory;
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
  target:
    | 'one-creature'
    | 'chosen-creatures'
    | 'creatures-in-area'
    | 'creatures-entered-during-move';
  targetType?: 'creature';
  rangeFeet?: number;
  requiresSight?: boolean;
  count?: number;
  canSelectSameTargetMultipleTimes?: boolean;
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

export type SourceActionImmunityEffect = EffectBase<'immunity'> & {
  scope: 'source-action';
  duration: EffectDuration;
  notes?: string;
};

export type SpellImmunityEffect = EffectBase<'immunity'> & {
  scope: 'spell';
  spellIds: string[];
  duration: EffectDuration;
  notes?: string;
};

export type ImmunityEffect = SourceActionImmunityEffect | SpellImmunityEffect;

export type DeathOutcomeEffect = EffectBase<'death-outcome'> & {
  trigger: 'reduced-to-0-hit-points-by-this-action';
  targetType?: 'creature';
  outcome: 'turns-to-dust';
};

export type HoldBreathEffect = EffectBase<'hold-breath'> & {
  duration: EffectDuration;
};

type TrackedPartDefinition = {
  initialCount: number;
  loss?: {
    trigger: 'damage-taken-in-single-turn';
    minDamage: number;
    count: number;
  };
  deathWhenCountReaches?: number;
  regrowth?: {
    trigger: 'turn-end';
    requiresLivingPart?: boolean;
    countPerPartLostSinceLastTurn: number;
    suppressedByDamageTypes?: EffectDamageType[];
    healHitPoints?: number;
  };
  change?: never;
};

type TrackedPartChange = {
  change: {
    mode: 'sever' | 'grow';
    count: number;
  };
  initialCount?: never;
  loss?: never;
  deathWhenCountReaches?: never;
  regrowth?: never;
};

export type TrackedPartEffect = EffectBase<'tracked-part'> & {
  part: 'head' | 'limb';
} & (TrackedPartDefinition | TrackedPartChange);

export type ExtraReactionEffect = EffectBase<'extra-reaction'> & {
  appliesTo: 'opportunity-attacks-only';
  count: {
    kind: 'per-part-beyond';
    part: 'head' | 'limb';
    baseline: number;
  };
};

export type MoveEffect = EffectBase<'move'> & {
  distance?: number;
  upToSpeedFraction?: 0.5 | 1;
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
  allowedSizes?: EffectSizeCategory[];
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

export type HitPointsEffect = EffectBase<'hit-points'> & {
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
  | ModifierEffect
  | FormulaEffect
  | GrantEffect
  | ResourceEffect
  | TriggeredEffect
  | SaveEffect
  | CheckEffect
  | ConditionEffect
  | ActivationEffect
  | DamageEffect
  | RollModifierEffect
  | ContainmentEffect
  | VisibilityRuleEffect
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