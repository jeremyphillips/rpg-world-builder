/**
 * Character read-model DTOs and reference types.
 * Used by GET /characters/me and GET /characters/:id.
 */

// ---------------------------------------------------------------------------
// Card DTO (GET /characters/me)
// ---------------------------------------------------------------------------

export type CharacterCardClassSummary = {
  classId: string
  className: string
  subclassId?: string | null
  subclassName?: string | null
  level: number
}

export type CharacterCardSummary = {
  id: string
  name: string
  type?: string
  imageUrl: string | null
  race: { id: string; name: string } | null
  classes: CharacterCardClassSummary[]
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

export type CharacterDetailClassSummary = {
  classId: string
  className: string
  subclassId?: string | null
  subclassName?: string | null
  level: number
}

export type CharacterDetailDto = {
  id: string
  _id: string
  name: string
  type: 'pc' | 'npc'
  imageUrl: string | null
  imageKey?: string | null

  race: { id: string; name: string } | null

  classes: CharacterDetailClassSummary[]

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
    baseBudget?: { coin: string; value: number }
  }

  hitPoints: {
    total: number
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
  classes?: Array<{ classId?: string; subclassId?: string }>
  proficiencies?: { skills?: string[] }
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
  proficiencyById: Map<string, IdNameSummary>
  itemById: Map<string, IdNameSummary>
}

export type LoadCharacterReadReferencesArgs = {
  characters: CharacterReadSource[]
  include?: {
    proficiencies?: boolean
    items?: boolean
  }
}
