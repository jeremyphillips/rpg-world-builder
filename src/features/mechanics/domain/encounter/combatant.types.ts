import type { Effect } from '@/features/mechanics/domain/effects/effects.types'

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
  damage?: string
  damageType?: string
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

export interface CombatantInstance {
  instanceId: string
  side: CombatantSide
  source: CombatantSourceRef
  stats: CombatantStatBlock
  attacks: CombatantAttackEntry[]
  activeEffects: Effect[]
  runtimeEffects: RuntimeEffectInstance[]
  turnHooks: RuntimeTurnHook[]
  suppressedHooks?: RuntimeMarker[]
  turnContext?: CombatantTurnContext
  conditions: RuntimeMarker[]
  states: RuntimeMarker[]
}
