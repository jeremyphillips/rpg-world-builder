import type { DiceOrFlat } from "@/features/mechanics/domain/dice";
import type { AbilityId } from "@/features/mechanics/domain/core/character/abilities.types";
import type { MonsterSizeCategory } from "@/features/content/monsters/domain/vocab/monster.vocab";
import type { ConditionId, DamageType, TraitRollTarget } from "./monster-combat.types";
import type { EffectDuration, EffectInterval } from "@/features/mechanics/domain/effects/timing.types";

export type MonsterConditionEffect = {
  kind: 'condition';
  condition: ConditionId;
  targetSizeMax?: MonsterSizeCategory;
  escapeDc?: number;
  escapeCheckDisadvantage?: boolean;
};

export type MonsterRollModifierEffect = {
  kind: 'roll-modifier';
  appliesTo: TraitRollTarget | TraitRollTarget[];
  modifier: 'advantage' | 'disadvantage';
};

export type MonsterEffect =
  | MonsterConditionEffect
  | MonsterRollModifierEffect
  | { kind: 'damage'; damage: DiceOrFlat; damageType?: DamageType }
  | {
      kind: 'state';
      state: string;
      targetSizeMax?: MonsterSizeCategory;
      escape?: {
        dc: number;
        ability?: AbilityId;
        skill?: string;
        actionRequired?: boolean;
      };
      ongoingEffects?: MonsterEffect[];
      notes?: string;
    }
  | {
    kind: 'move';
    distance?: number;
    forced?: boolean;
    toNearestUnoccupiedSpace?: boolean;
    withinFeetOfSource?: number;
    failIfNoSpace?: boolean;
    movesWithSource?: boolean;
    ignoresExtraCostForGrappledCreature?: boolean;
  }
  | {
      kind: 'form';
      form: 'true-form' | 'object';
      allowedSizes?: MonsterSizeCategory[];
      canReturnToTrueForm?: boolean;
      retainsStatistics?: boolean;
      equipmentTransforms?: boolean;
      notes?: string;
    }
  | { kind: 'text'; description: string }
  | { kind: 'action'; action: 'disengage' | 'hide' }
  | { kind: 'limb'; mode: 'sever' | 'grow'; count: number }
  | { kind: 'spawn'; creature: string; count: number; location: 'self-space' | 'self-cell'; actsWhen: 'immediately-after-source-turn' }
  | { kind: 'resource'; resource: 'exhaustion'; mode: 'set' | 'add'; value: 'per-missing-limb' }
  | { kind: 'hit-points'; mode: 'heal' | 'damage'; value: number };

export type MonsterAppliedEffect =
  | MonsterConditionEffect
  | {
    kind: 'state';
    state: string;
    escape?: {
      dc: number;
      ability?: AbilityId;
      skill?: string;
      actionRequired?: boolean;
    };
    ongoingEffects?: MonsterEffect[];
    notes?: string;
  }
  | { kind: 'text'; description: string };

export type MonsterOnHitEffect =
  | MonsterConditionEffect
  | {
    kind: 'save';
    save: {
      ability: AbilityId;
      dc: number;
    }
    onFail: MonsterAppliedEffect[];
    onSuccess?: MonsterAppliedEffect[];
  }
  | {
    kind: 'damage';
    damage: DiceOrFlat;
    damageType?: DamageType;
  };

export type MonsterRuleDuration = EffectDuration;

export type MonsterActionRule =
  | {
      kind: 'targeting';
      target: 'one-creature';
      targetType?: 'creature';
      rangeFeet: number;
      requiresSight?: boolean;
    }
  | {
      kind: 'apply-state';
      trigger: 'hit' | 'failed_save';
      state: string;
      targetType?: 'creature';
      duration?: MonsterRuleDuration;
      ongoingEffects?: MonsterEffect[];
      notes?: string;
    }
  | {
      kind: 'duration';
      trigger: 'hit' | 'failed_save';
      appliesTo:
        | {
            kind: 'condition';
            condition: ConditionId;
          }
        | {
            kind: 'state';
            state: string;
          };
      duration: MonsterRuleDuration;
    }
  | {
      kind: 'interval-effect';
      state: string;
      every: EffectInterval;
      effects: MonsterEffect[];
    }
  | {
      kind: 'immunity-on-success';
      trigger: 'successful_save';
      scope: 'source-action';
      duration: MonsterRuleDuration;
      notes?: string;
    }
  | {
      kind: 'death-outcome';
      trigger: 'reduced-to-0-hit-points-by-this-action';
      targetType?: 'creature';
      outcome: 'turns-to-dust';
    };

export type MonsterActionTrigger = {
  when: 'after_damage';
  targetState?: 'bloodied';
};

export type MonsterTriggeredSave = {
  ability: AbilityId;
  dc:
    | number
    | {
        kind: '5-plus-damage-taken';
      };
  except?: {
    damageTypes?: DamageType[];
    criticalHit?: boolean;
  };
  onSuccess?: MonsterEffect[];
  onFail?: MonsterEffect[];
};
