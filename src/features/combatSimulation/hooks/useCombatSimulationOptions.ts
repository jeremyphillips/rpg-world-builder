import { useMemo } from 'react'

import { formatMonsterOptionSubtitle, formatNpcOptionSubtitle, formatPartyOptionSubtitle } from '../helpers'
import type {
  CombatSimulationMonstersById,
  CombatSimulationNpc,
  CombatSimulationPartyMember,
  EnemyOption,
  PartyOption,
} from '../types'

export function useCombatSimulationOptions(args: {
  party: CombatSimulationPartyMember[]
  npcs: CombatSimulationNpc[]
  monstersById: CombatSimulationMonstersById
}) {
  const { party, npcs, monstersById } = args

  const partyOptions = useMemo<PartyOption[]>(
    () =>
      party.map((member) => ({
        id: member.id,
        label: member.name,
        subtitle: formatPartyOptionSubtitle(member),
      })),
    [party],
  )

  const monsterOptions = useMemo<EnemyOption[]>(
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

  const npcOptions = useMemo<EnemyOption[]>(
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

  const enemyOptions = useMemo(
    () => [...npcOptions, ...monsterOptions].sort((a, b) => a.label.localeCompare(b.label)),
    [npcOptions, monsterOptions],
  )

  const enemyOptionsByKey = useMemo(
    () => Object.fromEntries(enemyOptions.map((option) => [option.key, option])),
    [enemyOptions],
  )

  return { partyOptions, enemyOptions, enemyOptionsByKey }
}
