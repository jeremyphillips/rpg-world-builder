import type { CharacterClassSummary } from '@/features/character/read-model/character-read.types'

import { formatCharacterIdentityLine } from './formatCharacterIdentityLine'

export type NpcClassEntry = { classId?: string; level: number }

function npcClassesToSummaries(classes: NpcClassEntry[]): CharacterClassSummary[] {
  return classes.map((c, i) => ({
    classId: c.classId ?? `npc-class-${i}`,
    className: c.classId ?? 'Class',
    level: c.level,
  }))
}

/** Class line for NPC roster rows where only `classId` + `level` are available. */
export function formatNpcClassLine(npc: { classes?: NpcClassEntry[] }): string {
  const raw = npc.classes
  if (!raw || raw.length === 0) return ''
  return formatCharacterIdentityLine(npcClassesToSummaries(raw))
}
