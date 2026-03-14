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

export interface CombatantInstance {
  instanceId: string
  side: CombatantSide
  source: CombatantSourceRef
  stats: CombatantStatBlock
  attacks: CombatantAttackEntry[]
  activeEffects: Effect[]
  conditions: string[]
  states: string[]
}
