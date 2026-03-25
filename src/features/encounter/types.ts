import type { CharacterClassSummary } from '@/features/character/read-model/character-read.types'
import type { Monster } from '@/features/content/monsters/domain/types'

export type AllyOption = {
  id: string
  label: string
  subtitle: string
  imageUrl?: string | null
  imageKey?: string | null
}

export type OpponentOption = {
  key: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
  subtitle: string
  imageUrl?: string | null
  imageKey?: string | null
}

export type OpponentRosterEntry = {
  runtimeId: string
  sourceKey: string
  sourceId: string
  kind: 'npc' | 'monster'
  label: string
}

/** Subset of party roster (`CharacterRosterSummary`) used for ally pickers — full class summaries for subtitles. */
export type EncounterAllyMember = {
  id: string
  name: string
  race: { id: string; name: string } | null
  classes: CharacterClassSummary[]
  ownerName?: string
  /** From roster/card APIs (`getPublicUrl`); optional for tests/mocks. */
  imageUrl?: string | null
  imageKey?: string | null
}

export type EncounterNpc = {
  _id: string
  name: string
  race?: unknown
  classes?: { classId?: string; level: number }[]
  imageKey?: string | null
  imageUrl?: string | null
}

export type EncounterMonstersById = Record<string, Monster>
