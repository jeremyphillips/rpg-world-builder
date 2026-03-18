import type { DieFace } from "@/features/mechanics/domain/dice/dice.types";
import type { AbilityScoreMapResolved } from '@/features/mechanics/domain/character';
import type { TriggerType } from "../triggers/trigger.types";

export interface EvaluationContext {
  self: CreatureSnapshot
  target?: CreatureSnapshot
  source?: CreatureSnapshot
  event?: EventSnapshot
  world?: WorldSnapshot
  turn?: TurnSnapshot
}

// Flattened mechanical view, not full character model.
export interface CreatureSnapshot {
  id: string

  level: number
  proficiencyBonus?: number
  hp: number
  hpMax: number

  hitDie?: DieFace

  abilities: AbilityScoreMapResolved

  creatureType?: string
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
  type: TriggerType

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
