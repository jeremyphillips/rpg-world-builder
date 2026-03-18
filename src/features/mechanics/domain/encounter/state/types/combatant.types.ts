import type { Effect } from '@/features/mechanics/domain/effects/effects.types'
import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'
import type { AbilityKey } from '@/features/mechanics/domain/character'
import type { BreakdownToken } from '../../../resolution/resolvers/stat-resolver'
import type { CombatActionDefinition } from '../../resolution/combat-action.types'

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
  abilityScores?: Partial<Record<AbilityKey, number>>
  savingThrowModifiers?: Partial<Record<AbilityKey, number>>
  speeds?: Partial<Record<'ground' | 'climb' | 'fly' | 'swim' | 'burrow', number>>
}

export interface RuntimeMarkerDuration {
  remainingTurns: number
  tickOn: TurnBoundary
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
  boundary: TurnBoundary
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
  opportunityAttackReactionsRemaining: number
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
    trigger: 'damage-taken-in-single-turn'
    minDamage: number
    count: number
  }
  deathWhenCountReaches?: number
  regrowth?: {
    trigger: 'turn-end'
    requiresLivingPart?: boolean
    countPerPartLostSinceLastTurn: number
    suppressedByDamageTypes?: string[]
    healHitPoints?: number
  }
}

export function createCombatTurnResources(
  movementRemaining = 0,
  opportunityAttackReactionsRemaining = 0,
): CombatantTurnResources {
  return {
    actionAvailable: true,
    bonusActionAvailable: true,
    reactionAvailable: true,
    opportunityAttackReactionsRemaining,
    movementRemaining,
    hasCastBonusActionSpell: false,
  }
}

export interface StatModifierMarker {
  id: string
  label: string
  target: string
  mode: 'add'
  value: number
  duration?: RuntimeMarkerDuration
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
  statModifiers?: StatModifierMarker[]
  turnContext?: CombatantTurnContext
  turnResources?: CombatantTurnResources
  conditions: RuntimeMarker[]
  states: RuntimeMarker[]
}
