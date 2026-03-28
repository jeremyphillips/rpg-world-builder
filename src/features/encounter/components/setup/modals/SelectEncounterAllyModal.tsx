import { useState } from 'react'

import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { SelectEncounterCombatantModal } from './SelectEncounterCombatantModal'
import type { CombatantOption } from './SelectEncounterCombatantModal'

type SelectEncounterAllyModalProps = {
  open: boolean
  onClose: () => void
  partyOptions: CombatantOption[]
  npcOptions: CombatantOption[]
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
    <SelectEncounterCombatantModal
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
