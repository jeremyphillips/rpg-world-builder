import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { BreakdownToken } from '../resolution/stat-resolver'
import type { CombatActionDefinition } from './combat-actions.types'

export type CombatantSide = 'party' | 'enemies'

export type CombatantSourceKind = 'pc' | 'npc' | 'monster'

export interface CombatantSourceRef {
  kind: CombatantSourceKind
  sourceId: string
  label: string
}

export interface CombatantAttackEntry {
  id: string
  name: string
  attackBonus?: number
  attackBreakdown?: BreakdownToken[]
  damage?: string
  damageType?: string
  damageBreakdown?: BreakdownToken[]
  notes?: string
}

export interface CombatantStatBlock {
  armorClass: number
  maxHitPoints: number
  currentHitPoints: number
  initiativeModifier: number
  dexterityScore?: number
  speeds?: Partial<Record<'ground' | 'climb' | 'fly' | 'swim' | 'burrow', number>>
}

export interface RuntimeMarkerDuration {
  remainingTurns: number
  tickOn: 'start' | 'end'
}

export interface RuntimeMarker {
  id: string
  label: string
  duration?: RuntimeMarkerDuration
}

export interface RuntimeEffectInstance {
  id: string
  label: string
  effectKind: string
  duration: RuntimeMarkerDuration
}

export type RuntimeTurnHookRequirement =
  | { kind: 'self-state'; state: 'bloodied' }
  | { kind: 'damage-taken-this-turn'; damageType?: string; min?: number }
  | { kind: 'hit-points-equals'; value: number }

export interface RuntimeTurnHook {
  id: string
  label: string
  boundary: 'start' | 'end'
  effects: Effect[]
  requirements?: RuntimeTurnHookRequirement[]
  suppression?: {
    damageTypes?: string[]
    duration?: RuntimeMarkerDuration
  }
}

export interface CombatantTurnContext {
  totalDamageTaken: number
  damageTakenByType: Record<string, number>
}

export interface CombatantTurnResources {
  actionAvailable: boolean
  bonusActionAvailable: boolean
  reactionAvailable: boolean
  movementRemaining: number
  hasCastBonusActionSpell: boolean
}

export interface RuntimeTrackedPart {
  part: 'head' | 'limb'
  currentCount: number
  initialCount: number
  lostSinceLastTurn: number
  lossAppliedThisTurn: number
  damageWindowTurnKey?: string
  damageTakenThisTurn: number
  damageTakenByTypeThisTurn: Record<string, number>
  regrowthSuppressedByDamageTypes: string[]
  loss?: {
    trigger: 'damage_taken_in_single_turn'
    minDamage: number
    count: number
  }
  deathWhenCountReaches?: number
  regrowth?: {
    trigger: 'turn_end'
    requiresLivingPart?: boolean
    countPerPartLostSinceLastTurn: number
    suppressedByDamageTypes?: string[]
    healHitPoints?: number
  }
}

export function createCombatTurnResources(movementRemaining = 0): CombatantTurnResources {
  return {
    actionAvailable: true,
    bonusActionAvailable: true,
    reactionAvailable: true,
    movementRemaining,
    hasCastBonusActionSpell: false,
  }
}

export interface CombatantInstance {
  instanceId: string
  side: CombatantSide
  source: CombatantSourceRef
  stats: CombatantStatBlock
  attacks: CombatantAttackEntry[]
  actions?: CombatActionDefinition[]
  activeEffects: Effect[]
  runtimeEffects: RuntimeEffectInstance[]
  turnHooks: RuntimeTurnHook[]
  trackedParts?: RuntimeTrackedPart[]
  suppressedHooks?: RuntimeMarker[]
  turnContext?: CombatantTurnContext
  turnResources?: CombatantTurnResources
  conditions: RuntimeMarker[]
  states: RuntimeMarker[]
}
