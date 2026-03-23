import { useMemo } from 'react'

import { AppModal } from '@/ui/patterns'
import type { EncounterState } from '@/features/mechanics/domain/encounter'
import type { TurnOrderStatus } from '../../domain'
import { TurnOrderList } from './TurnOrderList'
import type { TurnOrderEntry } from './TurnOrderList'

type CombatTurnOrderModalProps = {
  open: boolean
  onClose: () => void
  encounterState: EncounterState
}

function resolveTurnStatus(
  combatantId: string,
  encounterState: EncounterState,
  orderIndex: number,
): TurnOrderStatus {
  const combatant = encounterState.combatantsById[combatantId]
  if (combatant && combatant.stats.currentHitPoints <= 0) return 'defeated'
  if (combatantId === encounterState.activeCombatantId) return 'current'
  if (orderIndex === encounterState.turnIndex + 1) return 'next'
  if (orderIndex < encounterState.turnIndex) return 'acted'
  return 'upcoming'
}

export function CombatTurnOrderModal({
  open,
  onClose,
  encounterState,
}: CombatTurnOrderModalProps) {
  const entries: TurnOrderEntry[] = useMemo(() => {
    return encounterState.initiative.map((roll, index) => ({
      combatantId: roll.combatantId,
      label: roll.label,
      initiativeTotal: roll.total,
      status: resolveTurnStatus(roll.combatantId, encounterState, index),
    }))
  }, [encounterState])

  return (
    <AppModal
      open={open}
      onClose={onClose}
      headline="Turn Order"
      subheadline={`Round ${encounterState.roundNumber}`}
      size="standard"
      secondaryAction={{ label: 'Close', onClick: onClose }}
    >
      <TurnOrderList entries={entries} />
    </AppModal>
  )
}
