import type { Condition } from '../conditions/condition.types';
import type { TriggerType } from '../triggers/trigger.types';
import type { TurnHookKind, TurnHookSelfTrigger } from '../triggers/turn-hooks.types';
import type { StatTarget } from '../resolution/resolvers/stat-resolver';
import type { FormulaEffect } from '../resolution/engines/formula.engine';
import type { DiceOrFlat } from '../dice/dice.types';
import type { AbilityKey, AbilityRef } from '../character';
import type { EffectDuration } from './timing.types';
import type { DamageType, EnergyDamageType } from '../damage/damage.types';
import type {
  ConditionImmunityId,
  EffectConditionId,
} from '../conditions/effect-condition-definitions';
import type { MonsterSizeCategory, MonsterType } from '@/features/content/monsters/domain/vocab/monster.vocab';
import type { EffectNoteCategory } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type { AreaOfEffectTemplate } from './area.types';
import type { TargetingEffectTarget } from './targeting.types';
import type { AttachedEnvironmentZoneProfile } from '../encounter/environment/environment.types';

export type { FormulaDefinition, FormulaEffect } from '../resolution/engines/formula.engine';
export type { AreaOfEffectTemplate } from './area.types';
export type { TargetingEffectTarget, MonsterSpecialActionTarget } from './targeting.types';
export type { DamageType, EnergyDamageType } from '../damage/damage.types';
export type { EffectConditionId, ConditionImmunityId, ConditionImmunityOnlyId } from '../conditions/effect-condition-definitions';
export {
  EFFECT_CONDITION_DEFINITIONS,
  CONDITION_IMMUNITY_ONLY_DEFINITIONS,
  EFFECT_CONDITION_IDS,
  CONDITION_IMMUNITY_ONLY_IDS,
  getEffectConditionRulesText,
  getEffectConditionRulesTextForKey,
} from '../conditions/effect-condition-definitions';

export type ScalingRule = {};

export type ResourceCost = {
  resource: string;
  amount: number;
};

export type ActivationKind = 'action' | 'bonus-action' | 'reaction' | 'special';
export type SaveDcSpec = number | { kind: '5-plus-damage-taken' };

export type EffectMode = 'add' | 'set' | 'multiply';

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
  /**
   * When applying a concentration spell, set to the same id pushed to `ConcentrationState.linkedMarkerIds`
   * so {@link dropConcentration} can remove this row from `activeEffects` when concentration ends.
   */
  concentrationLinkId?: string;
};

export type EffectBase<K extends string> = EffectMeta & { kind: K };

/** Temporary escape hatch for unknown/edition-specific effects. */
export type CustomEffect = EffectBase<'custom'> & {
  id: string;
  params?: Record<string, unknown>;
};

/** Energy damage ids (elemental + planar tables); used for modifier dice `type` and standalone modifier values. */
export type DamageTypeModifierValue = EnergyDamageType;

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
  /** When set, targets with this condition immunity pass the save without rolling (e.g. Sleep vs exhaustion). */
  autoSuccessIfImmuneTo?: ConditionImmunityId;
};

export type CheckEffect = EffectBase<'check'> & {
  name?: string;
  actor: 'nearby-creature';
  distanceFeet?: number;
  actionRequired?: boolean;
  /**
   * When true, the acting creature must visually perceive the **target combatant’s occupant** (shared
   * `canPerceiveTargetOccupantForCombat` seam) before the check is applied; otherwise the effect is blocked
   * with reason `cannot-perceive-subject`. Subject-based, not “cell known” alone.
   */
  requiresSight?: boolean;
  check: {
    ability: AbilityRef;
    skill?: string;
    dc: number;
  };
  target?: 'creature-inside' | 'object-inside';
  onSuccess?: Effect[];
  onFail?: Effect[];
};

export type RepeatSave = {
  ability: AbilityRef;
  timing: TurnHookKind;
  /**
   * When true, the hook is removed after the first save attempt (success or fail).
   * Use for Sleep-style “one repeat at end of next turn” vs default repeat-until-success.
   */
  singleAttempt?: boolean;
  /** After a failed repeat save when `singleAttempt` is true: remove `removeCondition` and apply this. */
  onFail?: {
    addCondition?: EffectConditionId;
    markerClassification?: string[];
  };
  /** Same as SaveEffect.autoSuccessIfImmuneTo — auto-pass repeat save without rolling. */
  autoSuccessIfImmuneTo?: ConditionImmunityId;
  /**
   * Contagion-style: count consecutive outcomes from repeat saves at this hook.
   * After `successCountToEnd` successes, remove `removeCondition` and the hook.
   * After `failCountToLock` failures, remove the hook (condition remains) and optionally add `failLockStateId`.
   */
  outcomeTrack?: {
    successCountToEnd?: number;
    failCountToLock?: number;
    failLockStateId?: string;
  };
};

export type ConditionEffect = EffectBase<'condition'> & {
  conditionId: EffectConditionId;
  classification?: string[];
  targetSizeMax?: EffectSizeCategory;
  escapeDc?: number;
  escapeCheckDisadvantage?: boolean;
  repeatSave?: RepeatSave;
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
  damageType?: DamageType;
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
  classification?: string[];
  targetSizeMax?: EffectSizeCategory;
  escape?: {
    dc: number;
    ability?: AbilityRef;
    skill?: string;
    actionRequired?: boolean;
  };
  ongoingEffects?: Effect[];
  notes?: string;
  repeatSave?: RepeatSave;
};

export type TargetingEffect = EffectBase<'targeting'> & {
  target: TargetingEffectTarget;
  targetType?: 'creature';
  /**
   * Touch-style buffs ("willing creature"): combat maps to same-side targets only (caster + allies).
   * Willing is approximated as allies until explicit consent is modeled.
   */
  requiresWilling?: boolean;
  creatureTypeFilter?: MonsterType[];
  rangeFeet?: number;
  requiresSight?: boolean;
  count?: number;
  canSelectSameTargetMultipleTimes?: boolean;
  area?: AreaOfEffectTemplate;
};

export type IntervalEffect = EffectBase<'interval'> & {
  stateId: string;
  every: {
    value: number;
    unit: 'turn' | 'round' | 'minute' | 'hour' | 'day';
  };
  effects: Effect[];
  /**
   * Optional triggers in addition to `every` (e.g. movement reconciliation when a creature newly enters
   * an attached emanation). See `resolveAttachedAuraSpatialEntryAfterMovement`.
   */
  spatialTriggers?: ('enter')[];
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
    suppressedByDamageTypes?: DamageType[];
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

/** Filter for random spawn from the merged monster catalog (e.g. Conjure Woodland Beings). */
export type SpawnPoolFilter = {
  creatureType: MonsterType;
  maxChallengeRating: number;
};

/** Per-option pool + count from a spell `resolution.casterOptions` enum (CR-tier conjures). */
export type SpawnPoolFromCasterOptionSpec = {
  count: number;
  maxChallengeRating: number;
  creatureType: MonsterType;
};

export type SpawnSummonInitiativeMode = 'group' | 'share-caster' | 'individual';

/**
 * Where a summon appears on the tactical grid. Authored on spell/monster spawn effects;
 * drives requirement/step modeling (remote cell vs self vs corpse-derived).
 */
export type SpawnPlacement =
  | {
      kind: 'single-cell'
      /** Range from caster; when omitted, use spell/action range in the adapter. */
      rangeFromCaster?: { value: number; unit: 'ft' }
      requiresLineOfSight?: boolean
      mustBeUnoccupied?: boolean
    }
  | {
      kind: 'self-space' | 'self-cell'
    }
  | {
      kind: 'inherit-from-target'
      /** Spawn uses dead target/remains placement (e.g. Animate Dead). */
    }

export type SpawnEffect = EffectBase<'spawn'> & {
  count: number;
  /** Tactical placement semantics; omit only for legacy data — prefer explicit authoring. */
  placement?: SpawnPlacement
  /** Legacy authored token when not using catalog ids (e.g. familiar, Troll Limb). */
  creature?: string;
  location?: 'self-space' | 'self-cell';
  actsWhen?: 'immediately-after-source-turn';
  /** Single catalog monster id; `count` copies (e.g. multiple zombies). */
  monsterId?: string;
  /** Explicit catalog ids (length usually matches `count`). */
  monsterIds?: string[];
  /** Random picks from catalog: `type` match and CR ≤ cap. */
  pool?: SpawnPoolFilter;
  /**
   * Resolve catalog id from the **spawn target’s** `remains` (`corpse` / `bones`; unset treated as `corpse`).
   * Used e.g. Animate Dead (zombie vs skeleton). Invalid if target is `dust` / `disintegrated`.
   */
  mapMonsterIdFromTargetRemains?: {
    corpse: string;
    bones: string;
  };
  /**
   * Resolve `monsterId` from `casterOptions[fieldId]` (e.g. conjure forms).
   * When present, resolution requires that caster option; ignores static `monsterId` / `pool`.
   */
  mapMonsterIdFromCasterOption?: {
    fieldId: string;
    valueToMonsterId: Record<string, string>;
  };
  /**
   * Resolve pool + count from `casterOptions[fieldId]` (e.g. conjure CR tiers).
   * When present, resolution requires that caster option; ignores static `pool` / `count` for picks.
   */
  poolFromCasterOption?: {
    fieldId: string;
    mapping: Record<string, SpawnPoolFromCasterOptionSpec>;
  };
  initiativeMode?: SpawnSummonInitiativeMode;
  /**
   * When true, after spawn resolves, tactical placement is transferred from the **target** to the
   * spawned combatant(s): the target is removed from `placements`, the first spawn occupies the
   * target's cell, extras use nearest empty passable cells. Use for replacement flows that are not
   * expressed via `mapMonsterIdFromTargetRemains` (e.g. future shapeshift / new-instance transforms).
   * `mapMonsterIdFromTargetRemains` implies the same placement transfer and does not require this flag.
   */
  inheritGridCellFromTarget?: boolean;
};

export type HitPointsEffect = EffectBase<'hit-points'> & {
  mode: 'heal' | 'damage';
  value: DiceOrFlat;
  abilityModifier?: boolean;
};

export type AuraEffect = EffectBase<'aura'> & {
  range: number;
  affects: 'allies' | 'enemies' | 'self';
  effects: Effect[];
};

/**
 * Persistent self-centered battlefield emanation (e.g. Spirit Guardians).
 * Not applied as a direct mechanical payload — the spell combat adapter and encounter UI use it for setup + grid aura.
 */
export type EmanationEffect = EffectBase<'emanation'> & {
  attachedTo: 'self';
  area: { kind: 'sphere'; size: number };
  /** When omitted, combat adapters treat this as `false` (no Spirit Guardians–style unaffected selection). */
  selectUnaffectedAtCast?: boolean;
  /**
   * When set, spell/monster combat adapters copy this to the adapted action’s `attachedEmanation.anchorMode`.
   * Omit for legacy caster-centered attached emanations (adapter defaults to `caster`).
   * **`place-or-object`:** SRD “point within range” vs “cast on object” — pair with {@link anchorChoiceFieldId} and `resolution.casterOptions`.
   */
  anchorMode?: 'caster' | 'place' | 'creature' | 'object' | 'place-or-object';
  /**
   * Required when `anchorMode === 'place-or-object'`: enum `casterOptions` field id (`value` `place` | `object`).
   */
  anchorChoiceFieldId?: string;
  /**
   * When set, spell combat adapter copies to `CombatActionDefinition.attachedEmanation` and runtime
   * syncs a matching `EncounterEnvironmentZone` from the attached aura row.
   */
  environmentZoneProfile?: AttachedEnvironmentZoneProfile;
};

export type NoteEffect = EffectBase<'note'> & {
  text: string;
  category?: EffectNoteCategory;
};

export type RemoveClassificationEffect = EffectBase<'remove-classification'> & {
  classification: string;
};

export type RegenerationEffect = EffectBase<'regeneration'> & {
  amount: number | DiceOrFlat;
  trigger: TurnHookSelfTrigger;
  suppressedByDamageTypes?: string[];
  suppressionDuration?: EffectDuration;
  disabledAtZeroHp?: boolean;
};

/**
 * Grants temporary hide-eligibility feature flags while the effect remains on `activeEffects`.
 * OR-merged with `skillRuntime.hideEligibilityFeatureFlags` in encounter hide resolution (see
 * `getCombatantHideEligibilityExtensionOptions`). Not a second permission system — same boolean seam.
 */
export type HideEligibilityGrantEffect = EffectBase<'hide-eligibility-grant'> & {
  featureFlags: {
    allowHalfCoverForHide?: boolean;
    allowDimLightHide?: boolean;
    allowMagicalConcealmentHide?: boolean;
    allowDifficultTerrainHide?: boolean;
    allowHighWindHide?: boolean;
  };
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
  | EmanationEffect
  | NoteEffect
  | RemoveClassificationEffect
  | RegenerationEffect
  | HideEligibilityGrantEffect
  | CustomEffect;