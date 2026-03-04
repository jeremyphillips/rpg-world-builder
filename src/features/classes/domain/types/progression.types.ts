import type { DieFace } from '@/features/mechanics/domain/dice/dice.types'
import type { AbilityId } from '@/features/mechanics/domain/core/character'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types';

export type AttackProgression = 'good' | 'average' | 'poor'
export type SaveProgression = 'good' | 'poor'

export type SpellcastingAbility =
  | 'full'
  | 'half'
  | 'third'
  | 'pact'
  | 'none';

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
  /** How spells are acquired each day:
   *  - 'known'    — fixed list; can cast any known spell using a slot (Sorcerer, Bard, Warlock, Ranger)
   *  - 'prepared' — choose daily from class list or spellbook (Wizard, Cleric, Druid, Paladin) */
  type: 'known' | 'prepared'

  /** For 'prepared' casters: formula for daily prepared count.
   *  e.g. 'int+level' (Wizard), 'wis+level' (Cleric/Druid), 'cha+halfLevel' (Paladin).
   *  Omit for editions where prepared count = slot count (2e, 1e, Basic). */
  preparedFormula?: string

  /** Cantrips / 0-level spells available at each class level. Index 0 = level 1.
   *  5e: number of cantrips known.
   *  3.5e: number of 0-level spell slots per day.
   *  Omit for editions without cantrips (2e, 1e, Basic). */
  cantripsKnown?: number[]

  /** Total spells known at each class level. Index 0 = level 1.
   *  5e 'known' casters only (Sorcerer, Bard, Warlock, Ranger).
   *  Use 0 for levels with no spells (e.g. Ranger level 1). */
  spellsKnown?: number[]

  /** Spells known broken down by spell level at each class level.
   *  spellsKnownByLevel[classLevel-1][spellLevel-1] = known count.
   *  3.5e 'known' casters (Sorcerer, Bard) — where allocation is per-level. */
  spellsKnownByLevel?: number[][]

  /** Spell slot table: spellSlots[classLevel-1][spellLevel-1] = number of slots.
   *  e.g. spellSlots[4] = [4, 3, 2] → at level 5: four 1st, three 2nd, two 3rd.
   *  Empty inner array [] means no spells at that class level. */
  spellSlots: number[][]

  /** Highest spell level this class ever reaches */
  maxSpellLevel: number

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