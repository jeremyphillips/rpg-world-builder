import { useState } from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { SelectEntityModal, type SelectEntityOption } from '@/ui/patterns'

type SelectEncounterOpponentModalProps = {
  open: boolean
  onClose: () => void
  headline?: string
  monsterOptions: SelectEntityOption[]
  npcOptions: SelectEntityOption[]
  selectedOpponentKeys: string[]
  onApply: (selectedKeys: string[]) => void
}

export function SelectEncounterOpponentModal({
  open,
  onClose,
  headline = 'Select Opponent Combatants',
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
    <SelectEntityModal
      open={open}
      onClose={onClose}
      headline={headline}
      options={activeOptions}
      selectedIds={selectedOpponentKeys}
      onApply={onApply}
      footerNote={`${selectedOpponentKeys.length} selected`}
      headerSlot={tabSlot}
    />
  )
}
