import { useMemo, useState } from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { SelectEncounterCombatantModal } from './SelectEncounterCombatantModal'
import type { CombatantOption } from './SelectEncounterCombatantModal'

type MonsterOptionSource = {
  id: string
  name: string
  challengeRating: string
  creatureType: string
}

type NpcOptionSource = {
  id: string
  name: string
  race?: string
  className?: string
}

type SelectEncounterOpponentModalProps = {
  open: boolean
  onClose: () => void
  monsters: MonsterOptionSource[]
  npcs: NpcOptionSource[]
  selectedOpponentKeys: string[]
  onApply: (selectedKeys: string[]) => void
}

export function SelectEncounterOpponentModal({
  open,
  onClose,
  monsters,
  npcs,
  selectedOpponentKeys,
  onApply,
}: SelectEncounterOpponentModalProps) {
  const [tab, setTab] = useState<'monsters' | 'npcs'>('monsters')

  const monsterOptions: CombatantOption[] = useMemo(
    () =>
      monsters.map((m) => ({
        id: `monster:${m.id}`,
        label: m.name,
        subtitle: [m.creatureType, m.challengeRating != null ? `CR ${m.challengeRating}` : null]
          .filter(Boolean)
          .join(' · ') || undefined,
      })),
    [monsters],
  )

  const npcOptions: CombatantOption[] = useMemo(
    () =>
      npcs.map((n) => ({
        id: `npc:${n.id}`,
        label: n.name,
        subtitle: [n.race, n.className].filter(Boolean).join(' · ') || undefined,
      })),
    [npcs],
  )

  const activeOptions = tab === 'monsters' ? monsterOptions : npcOptions

  const tabSlot = (
    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
      <Tab label="Monsters" value="monsters" />
      <Tab label="NPCs" value="npcs" />
    </Tabs>
  )

  return (
    <SelectEncounterCombatantModal
      open={open}
      onClose={onClose}
      headline="Select Opponent Combatants"
      options={activeOptions}
      selectedIds={selectedOpponentKeys}
      onApply={onApply}
      footerNote={`${selectedOpponentKeys.length} selected`}
      headerSlot={tabSlot}
    />
  )
}
