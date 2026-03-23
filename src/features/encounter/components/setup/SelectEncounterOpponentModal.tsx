import { useState } from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { SelectEncounterCombatantModal } from './SelectEncounterCombatantModal'
import type { CombatantOption } from './SelectEncounterCombatantModal'

type SelectEncounterOpponentModalProps = {
  open: boolean
  onClose: () => void
  monsterOptions: CombatantOption[]
  npcOptions: CombatantOption[]
  selectedOpponentKeys: string[]
  onApply: (selectedKeys: string[]) => void
}

export function SelectEncounterOpponentModal({
  open,
  onClose,
  monsterOptions,
  npcOptions,
  selectedOpponentKeys,
  onApply,
}: SelectEncounterOpponentModalProps) {
  const [tab, setTab] = useState<'monsters' | 'npcs'>('monsters')

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
