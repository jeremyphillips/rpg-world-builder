import type { ClassId } from '@/shared/types/ruleset';
import type { MagicSchool } from '@/features/content/shared/domain/vocab';
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentItem } from '@/features/content/shared/domain/types/content.types';
import type { Distance } from '@/shared/distance';
import type { Coin } from '@/shared/money/types';
import type { TimeUnit } from '@/shared/time';
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { ContentResolutionMeta } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type { CasterOptionField } from '@/features/mechanics/domain/spells/caster-options';

// later: Extract<Effect, ...>[]
export type SpellEffects = Effect[];

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type SpellRange =
  | { kind: 'self' }
  | { kind: 'touch' }
  | { kind: 'distance'; value: Distance }
  | { kind: 'sight' }
  | { kind: 'unlimited' }
  | { kind: 'special'; description: string }

export type CastingTimeUnit =
  | 'action'
  | 'bonus-action'
  | 'reaction'
  | 'minute'
  | 'hour';

export type SpellCastingTimeMode = {
  value: number;
  unit: CastingTimeUnit;
  trigger?: string;
  ritual?: boolean;
};

export type SpellCastingTime = {
  normal: SpellCastingTimeMode;
  alternate?: SpellCastingTimeMode[];
};

export type TimedDuration = {
  kind: 'timed';
  value: number;
  unit: TimeUnit;
  concentration?: boolean;
  upTo?: boolean;
};

export type TurnBoundarySpellDuration = {
  kind: 'until-turn-boundary';
  subject: 'self' | 'source' | 'target';
  turn: 'current' | 'next';
  boundary: TurnBoundary;
  concentration?: boolean;
};

export type SpellDuration =
  | { kind: 'instantaneous' }
  | TimedDuration
  | TurnBoundarySpellDuration
  | { kind: 'until-dispelled'; concentration?: boolean }
  | { kind: 'until-triggered'; concentration?: boolean; description?: string }
  | { kind: 'special'; description: string; concentration?: boolean };

export type MaterialComponent = {
  description: string;
  cost?: {
    value: number;
    unit: Coin;
    atLeast?: boolean;
  };
  consumed?: boolean;
  taxonomyIds?: string[];
};

export type SpellComponents = {
  verbal?: true;
  somatic?: true;
  material?: MaterialComponent;
};

export type SpellDeliveryMethod = 'melee-spell-attack' | 'ranged-spell-attack';

export type SpellScalingCategory =
  | 'extra-damage'
  | 'extra-healing'
  | 'extra-targets'
  | 'expanded-area'
  | 'expanded-range'
  | 'longer-duration'
  | 'other';

export type SpellScalingRule = {
  category: SpellScalingCategory;
  description: string;
  mode: 'per-slot-level' | 'threshold';
  startsAtSlotLevel?: SpellLevel;
  amount?: DiceOrFlat;
};

/** Encounter/combat adapter extras; keep spell effects as the primary payload. */
export type SpellHpThresholdResolution = {
  maxHp: number
  /** When target current HP is **greater** than `maxHp`, these effects apply instead of the spell’s main `effects` (after targeting is stripped). */
  aboveMaxHpEffects: SpellEffects
}

export type SpellResolutionMeta = ContentResolutionMeta & {
  /** HP-gated delivery (e.g. Power Word Kill: at-or-below vs above threshold). */
  hpThreshold?: SpellHpThresholdResolution
  /**
   * Override derived spell hostility for encounter/charm rules.
   * `true` = hostile application; `false` = non-hostile. Omit to use adapter-derived hostility from effects.
   */
  hostileIntent?: boolean
  /**
   * Choices the caster must specify when using this spell in encounter (ability for Hex, glyph effect for Symbol, etc.).
   * Copied onto spell combat actions by the spell combat adapter.
   */
  casterOptions?: CasterOptionField[]
}

export type SpellResolutionStatus = 'stub' | 'partial' | 'full';

export interface SpellBase {
  id: string;
  name: string;
  school: MagicSchool;
  level: SpellLevel;
  classes: ClassId[];
  castingTime: SpellCastingTime;
  range: SpellRange;
  duration: SpellDuration;
  components: SpellComponents;
  deliveryMethod?: SpellDeliveryMethod;
  effects: SpellEffects;
  scaling?: SpellScalingRule[];
  resolution?: SpellResolutionMeta;
  description: {
    full: string;
    summary: string;
  }
  imageKey?: string | null;
}

export type Spell = ContentItem & SpellBase;

/** Shape for create/update (omits id). */
export type SpellInput = Omit<SpellBase, 'id'> & {
  accessPolicy?: Visibility;
};
