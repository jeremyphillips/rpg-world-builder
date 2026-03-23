import { SelectEncounterCombatantModal } from './SelectEncounterCombatantModal'
import type { CombatantOption } from './SelectEncounterCombatantModal'

type SelectEncounterAllyModalProps = {
  open: boolean
  onClose: () => void
  options: CombatantOption[]
  selectedAllyIds: string[]
  onApply: (selectedIds: string[]) => void
}

export function SelectEncounterAllyModal({
  open,
  onClose,
  options,
  selectedAllyIds,
  onApply,
}: SelectEncounterAllyModalProps) {
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
