import type { BreakdownToken } from '../resolution/stat-resolver'

export type CombatActionKind =
  | 'weapon_attack'
  | 'monster_action'
  | 'spell'
  | 'combat_effect'

export type CombatActionResolutionMode = 'attack_roll' | 'log_only'

export interface CombatActionCost {
  action?: boolean
  bonusAction?: boolean
  reaction?: boolean
  movementFeet?: number
}

export interface CombatActionAttackProfile {
  attackBonus: number
  attackBreakdown?: BreakdownToken[]
  damage?: string
  damageType?: string
  damageBreakdown?: BreakdownToken[]
}

export interface CombatActionDefinition {
  id: string
  label: string
  kind: CombatActionKind
  cost: CombatActionCost
  resolutionMode: CombatActionResolutionMode
  attackProfile?: CombatActionAttackProfile
  logText?: string
}
