import type { ClassId } from '@/shared/types/ruleset';
import type { MagicSchool } from '@/features/content/shared/domain/vocab';
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentItem } from '@/features/content/shared/domain/types/content.types';
import type { Distance } from '@/shared/distance';
import type { Coin } from '@/shared/money/types';
import type { DurationUnit } from '@/shared/duration';

// later: Extract<Effect, ...>[]
export type SpellEffects = Effect[];

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type SpellRange =
  | { kind: 'self' }
  | { kind: 'touch' }
  | { kind: 'distance'; value: Distance }
  | { kind: 'sight' }
  | { kind: 'unlimited' }
  | { kind: 'special'; description: string };

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
  unit: DurationUnit;
  concentration?: boolean;
  upTo?: boolean;
};

export type SpellDuration =
  | { kind: 'instantaneous' }
  | TimedDuration
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
  ritual?: boolean;
  effects?: SpellEffects;
  description?: string;
  imageKey?: string | null;
}

export type Spell = ContentItem & SpellBase;

/** Shape for create/update (omits id). */
export type SpellInput = Omit<SpellBase, 'id'> & {
  accessPolicy?: Visibility;
};
