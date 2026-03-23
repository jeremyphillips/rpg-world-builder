import { useMemo } from 'react'

import { formatCharacterClassLine, formatNpcClassLine } from '@/features/character/formatters'
import type { CharacterClassSummary } from '@/features/character/read-model/character-read.types'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import type {
  EncounterMonstersById,
  EncounterNpc,
  EncounterAllyMember,
  OpponentOption,
  AllyOption,
} from '../types'

function formatAllyOptionSubtitle(member: EncounterAllyMember): string {
  const summaries: CharacterClassSummary[] = member.classes.map((c) => ({
    classId: c.className,
    className: c.className,
    level: c.level,
  }))
  const classLine = formatCharacterClassLine(summaries)
  const parts = [member.race?.name, classLine || undefined, member.ownerName].filter(Boolean) as string[]
  return parts.join(' · ')
}

export function useEncounterOptions(args: {
  allies: EncounterAllyMember[]
  npcs: EncounterNpc[]
  monstersById: EncounterMonstersById
}) {
  const { allies, npcs, monstersById } = args

  const allyOptions = useMemo<AllyOption[]>(
    () =>
      allies.map((member) => ({
        id: member.id,
        label: member.name,
        subtitle: formatAllyOptionSubtitle(member),
      })),
    [allies],
  )

  const monsterOptions = useMemo<OpponentOption[]>(
    () =>
      Object.values(monstersById)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((monster) => ({
          key: `monster:${monster.id}`,
          sourceId: monster.id,
          kind: 'monster' as const,
          label: monster.name,
          subtitle: formatMonsterIdentityLine(monster),
        })),
    [monstersById],
  )

  const npcOptions = useMemo<OpponentOption[]>(
    () =>
      npcs
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((npc) => {
          const classLine = formatNpcClassLine(npc)
          const raceStr = typeof npc.race === 'string' ? npc.race : null
          const subtitle = [raceStr, classLine].filter(Boolean).join(' · ')
          return {
            key: `npc:${npc._id}`,
            sourceId: npc._id,
            kind: 'npc' as const,
            label: npc.name,
            subtitle,
          }
        }),
    [npcs],
  )

  const opponentOptions = useMemo(
    () => [...npcOptions, ...monsterOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [npcOptions, monsterOptions],
  )

  const opponentOptionsByKey = useMemo(
    () => Object.fromEntries(opponentOptions.map((option) => [option.key, option])),
    [opponentOptions],
  )

  return { allyOptions, opponentOptions, opponentOptionsByKey }
}
