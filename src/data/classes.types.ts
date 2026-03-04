import type { DieFace } from '@/features/mechanics/domain/dice/dice.types'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { Material } from '@/features/content/domain/vocab'
import type { AbilityId, AbilityKey, AbilityScoreValue } from '@/features/mechanics/domain/core/character'
import type { AlignmentId } from '@/features/content/domain/types'

// ---------------------------------------------------------------------------
// Shared primitives  
// ---------------------------------------------------------------------------

export interface Note {
  id: string
  text: string
}

// ---------------------------------------------------------------------------
// Equipment & Requirements
// ---------------------------------------------------------------------------

export interface EquipmentRequirement {
  categories: string[] | 'all' | 'none'
  individuals: string[] | 'all' | 'none'
  disallowedMaterials?: Material[]
  notes?: Note[]
}

export type AbilityRequirement = {
  ability: AbilityKey;
  min: AbilityScoreValue;
};

export type AbilityRequirementGroup = {
  all: AbilityRequirement[];
};

export type RequirementExpr = {
  anyOf: AbilityRequirementGroup[];
  note?: string;
}

export interface ClassRequirement {
  allowedRaces: 'all' | string[]
  allowedAlignments: 'any' | AlignmentId[]
  levelCaps?: Record<string, number | 'unlimited'>
  minStats?: RequirementExpr
  multiclassing?: RequirementExpr
  startingWealth?: StartingWealth
  generationNotes?: Note[]
}

export interface WealthTier {
  /** [minLevel, maxLevel] inclusive */
  levelRange: number[]
  /** Total gold budget for a character starting at this level */
  baseGold: number
  /** Max value of any single item (optional, used by 5e) */
  maxItemValue?: number
}

export interface StartingWealth {
  /** Dice formula for level 1 (display / rolling) */
  classInitialGold?: string
  /** Average gold at level 1 (used as base for formula-based editions) */
  avgGold?: number
  /** Gold added per level beyond 1 (for linear-scaling editions: 1e, 2e, OD&D, Basic) */
  goldPerLevel?: number
  /** Level-based wealth tiers (for 5e, 3e, 3.5e, 4e) — takes precedence over avgGold+goldPerLevel */
  tiers?: WealthTier[]
}

// ---------------------------------------------------------------------------
// Definitions (subclass / archetype / kit)
// ---------------------------------------------------------------------------

export type SubclassFeature = {
  name: string
  level: number
  description?: string
  kind?: string
  [key: string]: unknown
}

export interface SubclassOption {
  id: string
  name: string
  source?: string
  features?: SubclassFeature[]
}

export interface ClassDefinition {
  id?: string
  name: string
  selectionLevel?: number | null
  options: SubclassOption[]
}

// ---------------------------------------------------------------------------
// Proficiencies
// ---------------------------------------------------------------------------

export interface ProficiencyOption {
  id: string
  name: string
  type?: 'category' | 'item'
  cost?: number
  source?: string
}

export interface ClassProficiencySkill {
  type: 'choice' | 'fixed'
  level: number
  choose: number
  from: string[]
}

export interface ClassProficiencyWeapon {
  type: 'fixed' | 'choice'
  level: number
  categories?: string[]
  items?: string[]
}

export interface ClassProficiencyArmor {
  type: 'fixed' | 'choice'
  level: number
  categories?: string[]
  items?: string[]
  disallowedMaterials?: Material[]
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

// ---------------------------------------------------------------------------
// Progression (core normalized fields -- present in all editions)
// ---------------------------------------------------------------------------

export type AttackProgression = 'good' | 'average' | 'poor'
export type SaveProgression = 'good' | 'poor'
export type ClassFeatureEffects = Effect[];

export interface ClassFeature {
  id: string
  level: number
  name: string
  description?: string
  effects?: ClassFeatureEffects
}

export type SpellcastingAbility =
  | 'full'
  | 'half'
  | 'third'
  | 'pact'
  | 'none';

export interface ClassProgression {
  hitDie: DieFace
  hpPerLevel?: number // 4e flat HP per level; other editions: derived from hitDie
  attackProgression: AttackProgression // normalized: good/average/poor
  primaryAbilities: AbilityId[]

  // ── 5e-specific ──────────────────────────────────────────────
  savingThrows?: AbilityId[]
  features?: ClassFeature[]
  asiLevels?: number[] // Ability Score Improvement levels
  spellcasting?: SpellcastingAbility
  spellProgression?: SpellProgression // actual spell slot table + known/prepared data
  extraAttackLevel?: number // level that grants Extra Attack
}

// ---------------------------------------------------------------------------
// CharacterClass (top-level)
// ---------------------------------------------------------------------------

export interface CharacterClass {
  id: string
  name: string
  description?: string
  definitions: ClassDefinition
  requirements: ClassRequirement
  proficiencies: {
    skills: ClassProficiencySkill
    weapons: ClassProficiencyWeapon
    armor: ClassProficiencyArmor
  }
  progression: ClassProgression,
  generation: {
    abilityPriority: AbilityId[]
  }
}
