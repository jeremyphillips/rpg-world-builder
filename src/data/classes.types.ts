import type { AlignmentId } from '@/data'
import type { AbilityId, AbilityIdAbbreviation } from '@/shared/types/character.core'
import type { Effect } from '@/features/mechanics/domain/effects/effects.types'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type LogicalOperator = 'and' | 'or'
export type Material = 'metal' | 'organic' | 'fabric' | 'wood' | 'stone' | string

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
  ability: AbilityId;
  min: number;
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

export type SubclassFeatureData = {
  name?: string
  level?: number
  description?: string
  kind?: string
  [key: string]: unknown
}

export interface SubclassOption {
  id: string
  name: string
  source?: string
  features?: SubclassFeatureData[]
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
  // 5e specific: classes can have 'category' or 'item' options
  type?: 'category' | 'item'
  cost?: number
  source?: string
  checkModifier?: number // 2e
  // 2e Thief skill
  // pointPool?: {
  //   initial: number
  //   perLevel: number
  // }
}

// export interface ClassProficiency {
//   // edition: EditionId | string
//   // taxonomy: string
//   name?: string
//   // choiceCount?: number
//   slots?: number // TODO: fold into choiceCount — only used by paladin 2e NWP; semantically identical
//   canSpecialize?: boolean
//   fixed?: ProficiencyOption[]
//   options?: ProficiencyOption[] | string
//   // 2e Thief skill
//   // pointPool?: {
//   //   initial: number
//   //   perLevel: number
//   // }
// }

export interface ClassProficiencySkill {
  type: 'choice' | 'fixed'
  level: number
  choose: number
  from: string[]
  // canSpecialize?: boolean
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

  // TODO: bonusSlots from high ability scores (3.5e, 2e, 1e) — handle as a shared utility
  // TODO: 2e priest sphere access — filter on available spells rather than progression
  // TODO: 3.5e domain spells — +1 slot per level for Cleric
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

export interface ClassProgression {
  hitDie: number                              // d6=6, d8=8, d10=10, d12=12; 4e: 0 (use hpPerLevel)
  hpPerLevel?: number                         // 4e flat HP per level; other editions: derived from hitDie
  attackProgression: AttackProgression         // normalized: good/average/poor
  primaryAbilities: AbilityIdAbbreviation[]                   // e.g. ['str', 'con'] for Fighter

  // ── Cross-edition grouping ─────────────────────────────────────
  // classGroup?: string                          // 2e group: 'warrior' | 'priest' | 'wizard' | 'rogue'

  // ── 5e-specific ──────────────────────────────────────────────
  savingThrows?: AbilityIdAbbreviation[]      // e.g. ['str', 'con']
  features?: ClassFeature[]                   // class features by level
  asiLevels?: number[]                        // levels that grant ASI (e.g. [4, 6, 8, 12, 14, 16, 19])
  spellcasting?: string                       // 'full' | 'half' | 'third' | 'pact' | 'none'
  spellProgression?: SpellProgression         // actual spell slot table + known/prepared data
  extraAttackLevel?: number                   // level that grants Extra Attack

  // ── 4e-specific ──────────────────────────────────────────────
  role?: string                               // Defender, Striker, Leader, Controller
  powerSource?: string                        // Martial, Arcane, Divine, Primal, Psionic
  healingSurges?: number                      // surges per day at 1st level
  surgeValue?: string                         // e.g. '1/4 HP'
  fortitudeBonus?: number                     // class bonus to Fortitude defense
  reflexBonus?: number                        // class bonus to Reflex defense
  willBonus?: number                          // class bonus to Will defense

  // ── 3e/3.5e-specific ────────────────────────────────────────
  babProgression?: number[]                   // BAB at each level (1-20)
  fortSave?: SaveProgression
  refSave?: SaveProgression
  willSave?: SaveProgression
  bonusFeats?: number[]                       // levels that grant bonus feats
  skillPointsPerLevel?: number                // base skill points per level (before Int mod)

  // ── 2e / 1e-specific ────────────────────────────────────────
  thac0ByLevel?: number[]                     // THAC0 at each level
  saves2e?: {
    ppd: number[]                             // Paralysis/Poison/Death Magic
    rsw: number[]                             // Rod/Staff/Wand
    pp: number[]                              // Petrification/Polymorph
    bw: number[]                              // Breath Weapon
    sp: number[]                              // Spell
  }
  weaponSlotsInitial?: number                 // starting weapon proficiency slots
  nwpSlotsInitial?: number                    // starting non-weapon proficiency slots
  weaponSlotInterval?: number                 // levels between gaining new weapon slots
  nwpSlotInterval?: number                    // levels between gaining new NWP slots
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
  progression?: ClassProgression,
  generation?: {
    abilityPriority: AbilityId[]
  }
}
