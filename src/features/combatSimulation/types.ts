import type { Monster } from '@/features/content/monsters/domain/types'

export type PartyOption = {
  id: string
  label: string
  subtitle: string
}

export type EnemyOption = {
  key: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
  subtitle: string
}

export type EnemyRosterEntry = {
  runtimeId: string
  sourceKey: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
}

export type CombatSimulationPartyMember = {
  id: string
  name: string
  race: { name: string } | null
  classes: { className: string; level: number }[]
  ownerName?: string
}

export type CombatSimulationNpc = {
  _id: string
  name: string
  race?: unknown
  classes?: { classId?: string; level: number }[]
}

export type CombatSimulationMonstersById = Record<string, Monster>
