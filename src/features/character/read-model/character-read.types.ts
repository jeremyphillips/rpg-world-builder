/**
 * Character read-model DTOs and reference types.
 * Used by GET /characters/me and GET /characters/:id.
 */

import type { Money } from "@/shared/money/types"
import type { ProficiencyAdjustment } from '@/features/character/domain/types'
import type { AbilityKey } from '@/features/mechanics/domain/character'
import type { SpellcastingAbility } from '@/features/content/classes/domain/types/progression.types'
import type { CastingMode } from "@/features/mechanics/domain/progression"
// ---------------------------------------------------------------------------
// Class summary (shared by card, detail, roster)
// ---------------------------------------------------------------------------

/** Progression data exposed on class summaries in the detail DTO. */
export type ClassProgressionSummary = {
  spellcasting?: SpellcastingAbility
  spellProgression?: {
    ability?: AbilityKey
    type?: CastingMode
  }
  hitDie: number
  attackProgression?: string
  savingThrows?: AbilityKey[]
}

export type CharacterClassSummary = {
  classId: string
  className: string
  subclassId?: string | null
  subclassName?: string | null
  level: number
  progression?: ClassProgressionSummary
}

/** Stored character class entry shape. Supports subclassId (current) and classDefinitionId (legacy). */
export type CharacterClassReadSource = {
  classId?: string
  subclassId?: string | null
  classDefinitionId?: string | null
  level: number
}

// ---------------------------------------------------------------------------
// Card DTO (GET /characters/me)
// ---------------------------------------------------------------------------

export type CharacterCardSummary = {
  id: string
  name: string
  type?: string
  imageUrl: string | null
  race: { id: string; name: string } | null
  classes: CharacterClassSummary[]
  campaign: { id: string; name: string } | null
}

/**
 * Campaign roster extension of CharacterCardSummary.
 * Used by GET /campaigns/:id/party.
 */
export type CharacterRosterSummary = CharacterCardSummary & {
  status: 'pending' | 'approved'
  ownerName: string
  ownerAvatarUrl?: string | null
  campaignMemberId?: string | null
}

// ---------------------------------------------------------------------------
// Detail DTO (GET /characters/:id)
// ---------------------------------------------------------------------------

export type CharacterDetailDto = {
  id: string
  _id: string
  name: string
  type: 'pc' | 'npc'
  imageUrl: string | null
  imageKey?: string | null

  race: { id: string; name: string } | null

  classes: CharacterClassSummary[]

  level: number
  totalLevel: number
  alignment?: string | null

  abilityScores: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }

  proficiencies: { id: string; name: string }[]

  equipment: {
    armor: { id: string; name: string }[]
    weapons: { id: string; name: string }[]
    gear: { id: string; name: string }[]
    magicItems?: string[]
  }

  wealth: {
    gp?: number
    sp?: number
    cp?: number
    baseBudget?: Money
  }

  hitPoints: {
    total: number
    current?: number
    generationMethod?: string
  }

  armorClass: {
    current: number
  }

  combat?: {
    loadout?: {
      armorId?: string
      shieldId?: string
      mainHandWeaponId?: string
      offHandWeaponId?: string
    }
  }

  spells?: string[]

  /**
   * Persisted daily resources. Keys like spell_slot_1, spell_slot_2 = remaining slots.
   * When absent, treat as full. Reset on long rest (future).
   *
   * KNOWN EDGE CASES:
   * - Warlock pact: Would need pact_slots key with short-rest semantics.
   */
  resources?: Record<string, number>

  narrative?: {
    personalityTraits?: string[]
    ideals?: string
    bonds?: string
    flaws?: string
    backstory?: string
  }

  levelUpPending?: boolean
  pendingLevel?: number
  xp?: number

  campaigns: { id: string; name: string }[]
}

// ---------------------------------------------------------------------------
// Reference types (for mappers)
// ---------------------------------------------------------------------------

/** Minimal character shape needed to collect reference IDs for resolution. */
export type CharacterReadSource = {
  race?: string
  classes?: CharacterClassReadSource[]
  proficiencies?: { skills?: Record<string, ProficiencyAdjustment> }
  equipment?: {
    armor?: string[]
    weapons?: string[]
    gear?: string[]
  }
}

export type IdNameSummary = {
  id: string
  name: string
}

export type CharacterReadReferences = {
  raceById: Map<string, IdNameSummary>
  classById: Map<string, IdNameSummary>
  subclassById: Map<string, IdNameSummary>
  classProgressionById: Map<string, ClassProgressionSummary>
  proficiencyById: Map<string, IdNameSummary>
  itemById: Map<string, IdNameSummary>
}

export type LoadCharacterReadReferencesArgs = {
  characters: CharacterReadSource[]
  include?: {
    proficiencies?: boolean
    items?: boolean
    classProgression?: boolean
  }
}
