import { useMemo } from 'react'

import { formatCharacterSubtitleLine, formatNpcClassLine } from '@/features/character/formatters'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import type {
  EncounterMonstersById,
  EncounterNpc,
  EncounterAllyMember,
  OpponentOption,
  AllyOption,
} from '../types'

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
        subtitle: formatCharacterSubtitleLine({
          raceName: member.race?.name,
          classes: member.classes,
          ownerName: member.ownerName,
        }),
        imageUrl: member.imageUrl,
        imageKey: member.imageKey,
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
          imageKey: monster.imageKey,
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
            imageKey: npc.imageKey,
            imageUrl: npc.imageUrl,
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
