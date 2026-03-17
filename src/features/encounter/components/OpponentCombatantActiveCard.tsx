import { useMemo } from 'react'

import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import {
  collectPresentableEffects,
  enrichPresentableEffects,
  sortByPriority,
  groupBySection,
} from '../domain'
import { formatSigned } from '../helpers'
import { CombatantActiveCard } from './CombatantActiveCard'

type OpponentCombatantActiveCardProps = {
  combatant: CombatantInstance
  availableActions: CombatActionDefinition[]
  selectedActionId?: string
  onSelectAction?: (actionId: string) => void
}

export function OpponentCombatantActiveCard({
  combatant,
  availableActions,
  selectedActionId,
  onSelectAction,
}: OpponentCombatantActiveCardProps) {
  const actions = useMemo(
    () => availableActions.filter((a) => a.cost.action && !a.cost.bonusAction),
    [availableActions],
  )
  const bonusActions = useMemo(
    () => availableActions.filter((a) => a.cost.bonusAction),
    [availableActions],
  )

  const combatEffects = useMemo(() => {
    const presentable = collectPresentableEffects(combatant)
    const enriched = enrichPresentableEffects(presentable)
    const sorted = sortByPriority(enriched)
    return groupBySection(sorted)
  }, [combatant])

  const stats = [
    { label: 'AC', value: String(combatant.stats.armorClass) },
    {
      label: 'HP',
      value: `${combatant.stats.currentHitPoints}/${combatant.stats.maxHitPoints}`,
    },
    { label: 'Init', value: formatSigned(combatant.stats.initiativeModifier) },
    ...(combatant.stats.speeds?.ground != null
      ? [{ label: 'Move', value: `${combatant.stats.speeds.ground} ft` }]
      : []),
  ]

  const trackedParts = combatant.trackedParts?.map((tp) => ({
    label: tp.part === 'head' ? 'Heads' : 'Limbs',
    current: tp.currentCount,
    initial: tp.initialCount,
  }))

  return (
    <CombatantActiveCard
      title={combatant.source.label}
      subtitle={combatant.source.kind === 'monster' ? 'Monster' : undefined}
      stats={stats}
      actions={actions}
      bonusActions={bonusActions}
      selectedActionId={selectedActionId}
      onSelectAction={onSelectAction}
      combatEffects={combatEffects}
      trackedParts={trackedParts}
    />
  )
}
