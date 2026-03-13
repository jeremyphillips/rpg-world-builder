export type MonsterMoraleCategory =
  | 'afraid'
  | 'bold'
  | 'cowardly'
  | 'defensive'
  | 'defiant'
  | 'frightened'
  | 'hostile'
  | 'steady'

export type MonsterMorale = {
  category: MonsterMoraleCategory
  value: number
}

export type MonsterFrequency = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'mythic'
  | 'epic'
  | 'legendary'

export type MonsterTreasureType =
  | 'nil'
  | 'c'
  | 'h'
  | 'v'

export type MonsterSpecialAttack = string

export type MonsterSpecialDefense = {
  name: string
  description: string
}

export type MonsterLegacyFields = {
  mechanics?: {
    attackBonus?: number
    specialAttacks?: MonsterSpecialAttack[]
    specialDefenses?: MonsterSpecialDefense[]
    morale?: MonsterMorale
    thac0?: number
  }
  lore?: {
    xpValue?: number
    frequency?: MonsterFrequency
    organization?: string
    treasureType?: MonsterTreasureType
  }
}
