import type { AbilityScores } from "@/shared/types/character.core";

export interface EvaluationContext {
  self: CreatureSnapshot
  target?: CreatureSnapshot
  event?: EventSnapshot
  world?: WorldSnapshot
  turn?: TurnSnapshot
}

// Flattened mechanical view, not full character model.
export interface CreatureSnapshot {
  id: string

  level: number
  hp: number
  hpMax: number

  hitDie?: number

  abilities: Record<keyof AbilityScores, number>

  conditions: string[] // prone, charmed, frightened, etc.

  resources: Record<string, number>

  equipment: {
    armorEquipped?: string | null
    shieldEquipped?: boolean
    weaponEquipped?: {
      id: string
      category: string
      properties: string[]
    }
  }

  flags: Record<string, boolean> // once-per-turn flags, rage active, etc.

  position?: {
    x: number
    y: number
  }
}

export interface EventSnapshot {
  type:
    | 'attack'
    | 'hit'
    | 'damage_taken'
    | 'turn_start'
    | 'turn_end'
    | 'spell_cast'

  attack?: {
    weaponCategory?: string
    isFinesse?: boolean
    isRanged?: boolean
    hasAdvantage?: boolean
  }

  damage?: {
    amount: number
    type: string
  }

  spell?: {
    level: number
    school: string
  }
}

export interface WorldSnapshot {
  creatures: CreatureSnapshot[]

  getDistance?: (aId: string, bId: string) => number
}

export interface TurnSnapshot {
  activeCreatureId: string
  round: number
  turnNumber: number
}
