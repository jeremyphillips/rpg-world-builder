import { AppModal } from '@/ui/patterns'

import type { EncounterSideOutcome } from '../../../helpers/derive-encounter-side-outcome'

function outcomeHeadline(outcome: EncounterSideOutcome): string {
  switch (outcome.kind) {
    case 'allies_win':
      return 'Victory — allies win'
    case 'enemies_win':
      return 'Defeat — enemies win'
    case 'stalemate':
      return 'Encounter over — no combatants standing'
    default:
      return 'Encounter over'
  }
}

type EncounterGameOverModalProps = {
  open: boolean
  outcome: EncounterSideOutcome
  onClose: () => void
  onResetEncounter: () => void
}

export function EncounterGameOverModal({
  open,
  outcome,
  onClose,
  onResetEncounter,
}: EncounterGameOverModalProps) {
  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline={outcomeHeadline(outcome)}
      subheadline="The encounter has ended."
      size="standard"
      primaryAction={{ label: 'Reset encounter', onClick: onResetEncounter }}
      secondaryAction={{ label: 'Close', onClick: onClose }}
    />
  )
}
