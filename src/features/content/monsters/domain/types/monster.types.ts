export interface Monster {
  id: string
  name: string
  type?: string
  subtype?: string
  sizeCategory?: string
  languages?: string[]
  vision?: string

  meta?: {
    createdFrom?: {
      preset: string
      setting?: string
    }
    source?: { book: string; page?: number }
  }

  description?: {
    short?: string
    long?: string
  }

  mechanics: {
    hitDice: number
    hitDieSize: number
    armorClass: number
    thac0?: number
    attackBonus?: number
    movement: {
      ground?: number
      fly?: number
      swim?: number
      burrow?: number
    }
    attacks: { name: string; dice: string }[]
    specialAttacks?: string[]
    specialDefenses?: string[]
    morale?: { category: string; value: number }
    abilities?: Record<string, number>
    traits?: string[]
    actions?: { name: string; bonus?: number; damage?: string }[]
  }

  lore: {
    alignment?: string
    xpValue?: number
    frequency?: string
    organization?: string
    treasureType?: string
    intelligence?: string
    challengeRating?: number
  }
}
