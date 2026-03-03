import type { AbilityScores } from '@/shared/types/character.core';
import type { Condition } from '../conditions/condition.types';
import type { TriggerType } from '../triggers/trigger.types';
import type { StatTarget } from '../resolution/stat-resolver';
import type { FormulaEffect } from '../resolution/formula.engine';
import type { DiceOrFlat } from '../dice/dice.types';

export type { FormulaDefinition, FormulaEffect } from '../resolution/formula.engine';

export type Duration =
  | '1 minute'
  | '1 hour'
  | '1 day'
  | '1 week'
  | '1 month'
  | '1 year'
  | 'instant';

export type ScalingRule = {};

export type ResourceCost = {
  resource: string;
  amount: number;
};

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
  duration?: Duration;
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
  | {
      ability?: keyof AbilityScores;
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
  | AuraEffect
  | NoteEffect
  | CustomEffect;