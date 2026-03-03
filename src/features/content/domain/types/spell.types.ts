import type { ClassId } from '@/shared/types/ruleset';
import type { MagicSchool } from '../vocab';
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';

 // later: Extract<Effect, ...>[]
export type SpellEffects = Effect[];

export interface Spell {
  id: string
  name: string
  school: MagicSchool
  level: number // 0 = cantrip (5e), 1-9 for leveled spells
  classes: ClassId[]
  ritual?: boolean
  concentration?: boolean
  source?: string
  effects?: SpellEffects
}
