import { useState } from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { SelectEntityModal, type SelectEntityOption } from '@/ui/patterns'

type SelectEncounterAllyModalProps = {
  open: boolean
  onClose: () => void
  partyOptions: SelectEntityOption[]
  npcOptions: SelectEntityOption[]
  selectedAllyIds: string[]
  onApply: (selectedIds: string[]) => void
}

export function SelectEncounterAllyModal({
  open,
  onClose,
  partyOptions,
  npcOptions,
  selectedAllyIds,
  onApply,
}: SelectEncounterAllyModalProps) {
  const [tab, setTab] = useState<'party' | 'npcs'>('party')

  const activeOptions = tab === 'party' ? partyOptions : npcOptions

  const tabSlot = (
    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
      <Tab label="Party" value="party" />
      <Tab label="NPCs" value="npcs" />
    </Tabs>
  )

  return (
    <SelectEntityModal
      open={open}
      onClose={onClose}
      headline="Select Ally Combatants"
      options={activeOptions}
      selectedIds={selectedAllyIds}
      onApply={onApply}
      footerNote={`${selectedAllyIds.length} selected`}
      headerSlot={tabSlot}
    />
  )
}
