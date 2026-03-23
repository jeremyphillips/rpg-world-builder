import { useMemo } from 'react'

import { SelectEncounterCombatantModal } from './SelectEncounterCombatantModal'
import type { CombatantOption } from './SelectEncounterCombatantModal'

type AllyOptionSource = {
  id: string
  name: string
  race?: string
  className?: string
  level?: number
}

type SelectEncounterAllyModalProps = {
  open: boolean
  onClose: () => void
  allies: AllyOptionSource[]
  selectedAllyIds: string[]
  onApply: (selectedIds: string[]) => void
}

export function SelectEncounterAllyModal({
  open,
  onClose,
  allies,
  selectedAllyIds,
  onApply,
}: SelectEncounterAllyModalProps) {
  const options: CombatantOption[] = useMemo(
    () =>
      allies.map((a) => ({
        id: a.id,
        label: a.name,
        subtitle: [a.race, a.className, a.level != null ? `Lv ${a.level}` : null]
          .filter(Boolean)
          .join(' · ') || undefined,
      })),
    [allies],
  )

  return (
    <SelectEncounterCombatantModal
      open={open}
      onClose={onClose}
      headline="Select Ally Combatants"
      options={options}
      selectedIds={selectedAllyIds}
      onApply={onApply}
      footerNote={`${selectedAllyIds.length} selected`}
    />
  )
}
