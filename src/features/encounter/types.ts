import type { Monster } from '@/features/content/monsters/domain/types'

export type AllyOption = {
  id: string
  label: string
  subtitle: string
}

export type OpponentOption = {
  key: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
  subtitle: string
}

export type OpponentRosterEntry = {
  runtimeId: string
  sourceKey: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
}

export type EncounterAllyMember = {
  id: string
  name: string
  race: { name: string } | null
  classes: { className: string; level: number }[]
  ownerName?: string
}

export type EncounterNpc = {
  _id: string
  name: string
  race?: unknown
  classes?: { classId?: string; level: number }[]
}

export type EncounterMonstersById = Record<string, Monster>
