import type { InitiativeRoll } from '../../resolution'
import type { CombatantInstance } from './combatant.types'
import type { CombatLogEvent } from './combat-log.types'
import type { EncounterSpace, CombatantPosition } from '@/features/encounter/space'
import type { AttachedBattlefieldEffectSource } from '../attached-battlefield-source'

/** Runtime attached battlefield aura (e.g. Spirit Guardians emanation). */
export type AttachedAuraInstance = {
  id: string
  sourceCombatantId: string
  /** Origin of the effect (spell, monster action, or future monster trait). */
  source: AttachedBattlefieldEffectSource
  attachedTo: 'self'
  area: { kind: 'sphere'; size: number }
  unaffectedCombatantIds: string[]
  /** Save DC at cast/use time for nested save payloads (intervals, spatial entry). */
  saveDc?: number
}

export interface EncounterState {
  combatantsById: Record<string, CombatantInstance>
  partyCombatantIds: string[]
  enemyCombatantIds: string[]
  initiative: InitiativeRoll[]
  initiativeOrder: string[]
  activeCombatantId: string | null
  turnIndex: number
  roundNumber: number
  started: boolean
  log: CombatLogEvent[]
  space?: EncounterSpace
  placements?: CombatantPosition[]
  /** Persistent self-centered effects tied to a combatant (e.g. Spirit Guardians). */
  attachedAuraInstances?: AttachedAuraInstance[]
}
