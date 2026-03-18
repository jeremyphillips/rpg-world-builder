import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { AbilityId } from '@/features/mechanics/domain/character'
import type { BreakdownToken } from '../../resolution/resolvers/stat-resolver'

export type CombatActionKind =
  | 'weapon-attack'
  | 'monster-action'
  | 'spell'
  | 'combat-effect'

export type CombatActionResolutionMode = 'attack-roll' | 'saving-throw' | 'effects' | 'log-only'

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

export interface CombatActionSequenceStep {
  actionLabel: string
  count: number
  countFromTrackedPart?: 'head' | 'limb'
}

export interface CombatActionSaveProfile {
  ability: AbilityId
  dc: number
  halfDamageOnSave?: boolean
}

export interface CombatActionTargetingProfile {
  kind: 'single-target' | 'all-enemies' | 'entered-during-move' | 'self'
}

export interface CombatActionMovementProfile {
  upToSpeed?: boolean
  upToSpeedFraction?: 0.5 | 1
  noOpportunityAttacks?: boolean
  canEnterCreatureSpaces?: boolean
  targetSizeMax?: string
  straightTowardVisibleEnemy?: boolean
}

export interface CombatActionUsage {
  recharge?: {
    min: number
    max: number
    ready: boolean
  }
  uses?: {
    max: number
    remaining: number
    period: 'day'
  }
}

export interface CombatActionDefinition {
  id: string
  label: string
  kind: CombatActionKind
  cost: CombatActionCost
  resolutionMode: CombatActionResolutionMode
  attackProfile?: CombatActionAttackProfile
  damage?: string
  damageType?: string
  saveProfile?: CombatActionSaveProfile
  targeting?: CombatActionTargetingProfile
  movement?: CombatActionMovementProfile
  usage?: CombatActionUsage
  effects?: Effect[]
  onHitEffects?: Effect[]
  onFailEffects?: Effect[]
  onSuccessEffects?: Effect[]
  sequence?: CombatActionSequenceStep[]
  logText?: string
}
