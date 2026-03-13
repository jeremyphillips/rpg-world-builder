import type { ClassId } from '@/shared/types/ruleset';
import type { MagicSchool } from '@/features/content/shared/domain/vocab';
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';
import type { Visibility } from '@/shared/types/visibility';
import type { ContentItem } from '@/features/content/shared/domain/types/content.types';

 // later: Extract<Effect, ...>[]
export type SpellEffects = Effect[];

export interface SpellBase {
  id: string;
  name: string;
  school: MagicSchool;
  level: number; // 0 = cantrip (5e), 1-9 for leveled spells
  classes: ClassId[];
  ritual?: boolean;
  concentration?: boolean;
  effects?: SpellEffects;
  description?: string;
  imageKey?: string | null;
}

export type Spell = ContentItem & SpellBase;

/** Shape for create/update (omits id). */
export type SpellInput = Omit<SpellBase, 'id'> & {
  accessPolicy?: Visibility;
};
