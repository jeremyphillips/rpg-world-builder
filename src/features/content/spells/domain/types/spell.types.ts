import type { ClassId } from '@/shared/types/ruleset';
import type {
  ActionEconomyKind,
  MagicSchool,
  SpellRangeKind,
} from '@/features/content/shared/domain/vocab';
import type { DamageType } from '@/features/mechanics/domain/damage/damage.types';
import type { Effect, EffectConditionId } from '@/features/mechanics/domain/effects/effects.types';
import type { SpellFunctionTag } from '../vocab/spellFunctionTags.vocab';
import type { SpellRoleTag } from '../vocab/spellRoleTags.vocab';
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentItem } from '@/features/content/shared/domain/types/content.types';
import type { Distance } from '@/shared/domain/distance';
import type { Coin } from '@/shared/money/types';
import type { SpellCastingTimeDurationUnit, TimeUnit } from '@/shared/domain/time';
import type { DiceOrFlat } from '@/features/mechanics/domain/dice'
import type { ContentResolutionMeta } from '@/features/mechanics/domain/resolution/content-resolution.types';
import type { CasterOptionField } from '@/features/mechanics/domain/spells/caster-options';

/** Authored spell outcomes — never `kind: 'targeting'` (targeting lives on the group). */
export type SpellEffect = Exclude<Effect, { kind: 'targeting' }>;

/** Targeting context for a spell effect group (same payload as legacy `TargetingEffect` minus `kind`). */
export type SpellEffectTargeting = Omit<Extract<Effect, { kind: 'targeting' }>, 'kind'>;

export type SpellEffectGroup = {
  targeting?: SpellEffectTargeting;
  effects: SpellEffect[];
};

export type SpellTags = {
  damageTypes?: DamageType[];
  conditions?: EffectConditionId[];
  roles?: SpellRoleTag[];
  functions?: SpellFunctionTag[];
};

/** Single source of truth for authored spell tier (0 = cantrip). */
export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type SpellLevel = (typeof SPELL_LEVELS)[number];

export type SpellRange =
  | { kind: Extract<SpellRangeKind, 'self'> }
  | { kind: Extract<SpellRangeKind, 'touch'> }
  | { kind: Extract<SpellRangeKind, 'distance'>; value: Distance }
  | { kind: Extract<SpellRangeKind, 'sight'> }
  | { kind: Extract<SpellRangeKind, 'unlimited'> }
  | { kind: Extract<SpellRangeKind, 'special'>; description: string };

/** Spell casting time unit: action economy (incl. special) or long-cast duration units from shared time. */
export type CastingTimeUnit = ActionEconomyKind | SpellCastingTimeDurationUnit;

export type SpellCastingTimeMode = {
  value: number;
  unit: CastingTimeUnit;
  trigger?: string;
  /** Named variant for multi-mode spells (e.g. Overgrowth vs Enrichment). */
  label?: string;
};

export type SpellCastingTime = {
  normal: SpellCastingTimeMode;
  /** Only when the spell has multiple distinct casting-time modes in the rules. */
  alternate?: SpellCastingTimeMode[];
  canBeCastAsRitual: boolean;
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
  /** When target current HP is **greater** than `maxHp`, these effects apply instead of the spell’s main payload. */
  aboveMaxHpEffects: SpellEffect[]
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
  effectGroups: SpellEffectGroup[];
  scaling?: SpellScalingRule[];
  resolution?: SpellResolutionMeta;
  description: {
    full: string;
    summary: string;
  }
  /**
   * Browse/filter metadata: damage types, conditions, tactical roles, and fantasy-purpose functions.
   * Roles = play-pattern identity; functions = communication, utility, deception, etc.
   */
  tags?: SpellTags;
  imageKey?: string | null;
}

/** Alias for the authored spell definition (`Spell` adds `ContentItem`). */
export type SpellDefinition = SpellBase;

export type Spell = ContentItem & SpellBase;

/** Shape for create/update (omits id). */
export type SpellInput = Omit<SpellBase, 'id'> & {
  accessPolicy?: Visibility;
};
