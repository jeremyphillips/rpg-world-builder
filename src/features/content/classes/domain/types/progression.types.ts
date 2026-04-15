import type { DieFace } from '@/shared/domain/dice';
import type { AbilityId } from '@/features/mechanics/domain/character'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';

export type AttackProgression = 'good' | 'average' | 'poor'
export type SaveProgression = 'good' | 'poor'

export type SpellcastingAbility = 'full' | 'half' | 'pact' | 'none';

export type ClassFeatureEffects = Effect[];

export interface ClassFeature {
  id: string
  level: number
  name: string
  description?: string
  effects?: ClassFeatureEffects
}

// ---------------------------------------------------------------------------
// Spell Progression
// ---------------------------------------------------------------------------

export interface SpellProgression {
  ability: AbilityId
  /** How spells are acquired each day:
   *  - 'known'    — fixed list; can cast any known spell using a slot (Sorcerer, Bard, Warlock, Ranger)
   *  - 'prepared' — choose daily from class list or spellbook (Wizard, Cleric, Druid, Paladin) */
  type: 'known' | 'prepared'

  /** Cantrips / 0-level spells: profile key from CANTRIP_PROGRESSION_PROFILES.
   *  Omit for classes with no cantrips (e.g. Paladin, Ranger). */
  cantripsKnown?: 'standard2' | 'standard3' | 'standard4'

  /** Total spells known at each class level. Index 0 = level 1.
   *  5e 'known' casters only (Sorcerer, Bard, Warlock, Ranger).
   *  Use 0 for levels with no spells (e.g. Ranger level 1). */
  spellsKnown?: number[]

  /** 5e Warlock only: Mystic Arcanum spells (one known of each level, once per long rest) */
  mysticArcanum?: { spellLevel: number; grantedAtClassLevel: number }[]
}

export interface ClassProgression {
  hitDie: DieFace
  hpPerLevel?: number // 4e flat HP per level; other editions: derived from hitDie
  attackProgression: AttackProgression // normalized: good/average/poor
  savingThrows?: AbilityId[]
  features?: ClassFeature[]
  asiLevels?: number[] // Ability Score Improvement levels
  spellcasting?: SpellcastingAbility
  spellProgression?: SpellProgression // actual spell slot table + known/prepared data
  extraAttackLevel?: number // level that grants Extra Attack
}
