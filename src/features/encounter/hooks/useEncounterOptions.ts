import { useMemo } from 'react'

import { formatMonsterOptionSubtitle, formatNpcOptionSubtitle, formatAllyOptionSubtitle } from '../helpers'
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
          subtitle: formatMonsterOptionSubtitle(monster),
        })),
    [monstersById],
  )

  const npcOptions = useMemo<OpponentOption[]>(
    () =>
      npcs
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((npc) => ({
          key: `npc:${npc._id}`,
          sourceId: npc._id,
          kind: 'npc' as const,
          label: npc.name,
          subtitle: formatNpcOptionSubtitle({
            race: typeof npc.race === 'string' ? npc.race : null,
            classes: npc.classes?.map((cls) => ({
              className: cls.classId,
              level: cls.level,
            })),
          }),
        })),
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
