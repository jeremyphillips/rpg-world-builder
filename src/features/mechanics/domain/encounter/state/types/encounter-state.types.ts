import type { CombatantInstance } from './combatant.types'
import type { InitiativeRoll } from '../../resolution'
import type { CombatLogEvent } from './combat-log.types'

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
}
