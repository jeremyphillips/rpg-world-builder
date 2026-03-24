import { useMemo } from 'react'

import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import {
  collectPresentableEffects,
  enrichPresentableEffects,
  sortByPriority,
  groupBySection,
} from '../../../domain'
import { CombatantActionDrawer } from './CombatantActionDrawer'

type OpponentActionDrawerProps = {
  open: boolean
  onClose: () => void
  combatant: CombatantInstance
  availableActions: CombatActionDefinition[]
  validActionIdsForTarget?: Set<string>
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
  selectedCasterOptions?: Record<string, string>
  onCasterOptionsChange?: (values: Record<string, string>) => void
  targetLabel?: string | null
  canResolveAction?: boolean
  onResolveAction?: () => void
  onEndTurn?: () => void
}

export function OpponentActionDrawer({
  open,
  onClose,
  combatant,
  availableActions,
  validActionIdsForTarget,
  selectedActionId,
  onSelectAction,
  selectedCasterOptions,
  onCasterOptionsChange,
  targetLabel,
  canResolveAction,
  onResolveAction,
  onEndTurn,
}: OpponentActionDrawerProps) {
  const availableActionIds = useMemo(
    () => new Set(availableActions.map((a) => a.id)),
    [availableActions],
  )
  const actions = useMemo(
    () => (combatant.actions ?? []).filter((a) => a.cost.action && !a.cost.bonusAction),
    [combatant.actions],
  )
  const bonusActions = useMemo(
    () => (combatant.actions ?? []).filter((a) => a.cost.bonusAction),
    [combatant.actions],
  )

  const combatEffects = useMemo(() => {
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    const sorted = sortByPriority(enriched)
    return groupBySection(sorted)
  }, [combatant])

  return (
    <CombatantActionDrawer
      open={open}
      onClose={onClose}
      title={combatant.source.label}
      actions={actions}
      bonusActions={bonusActions}
      availableActionIds={availableActionIds}
      validActionIdsForTarget={validActionIdsForTarget}
      selectedActionId={selectedActionId}
      onSelectAction={onSelectAction}
      selectedCasterOptions={selectedCasterOptions}
      onCasterOptionsChange={onCasterOptionsChange}
      combatEffects={combatEffects}
      targetLabel={targetLabel}
      canResolveAction={canResolveAction}
      onResolveAction={onResolveAction}
      onEndTurn={onEndTurn}
    />
  )
}
