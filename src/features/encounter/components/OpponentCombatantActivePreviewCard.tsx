import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import type { CombatantPreviewCardProps, PreviewChip, PreviewStat } from '../domain'
import { formatSigned } from '../helpers'
import { CombatantPreviewCard } from './CombatantPreviewCard'

type OpponentCombatantActivePreviewCardProps = {
  combatant: CombatantInstance
  isCurrentTurn?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function OpponentCombatantActivePreviewCard({
  combatant,
  isCurrentTurn = false,
  isSelected = false,
  onClick,
}: OpponentCombatantActivePreviewCardProps) {
  const isDefeated = combatant.stats.currentHitPoints <= 0

  const stats: PreviewStat[] = [
    { label: 'AC', value: String(combatant.stats.armorClass) },
    { label: 'HP', value: `${combatant.stats.currentHitPoints}/${combatant.stats.maxHitPoints}` },
    { label: 'Init', value: formatSigned(combatant.stats.initiativeModifier) },
  ]

  if (combatant.trackedParts && combatant.trackedParts.length > 0) {
    for (const part of combatant.trackedParts) {
      stats.push({
        label: part.part === 'head' ? 'Heads' : 'Limbs',
        value: `${part.currentCount}/${part.initialCount}`,
      })
    }
  }

  const chips: PreviewChip[] = [
    ...(combatant.concentration
      ? [{ id: 'concentrating', label: 'Concentrating', tone: 'info' as const }]
      : []),
    ...combatant.conditions.map((c) => ({ id: c.id, label: c.label, tone: 'warning' as const })),
    ...combatant.states.map((s) => ({ id: s.id, label: s.label, tone: 'info' as const })),
  ]

  const previewProps: CombatantPreviewCardProps = {
    id: combatant.instanceId,
    kind: 'monster',
    mode: 'active',
    title: combatant.source.label,
    stats,
    chips: chips.length > 0 ? chips : undefined,
    isCurrentTurn,
    isSelected,
    isDefeated,
    onClick,
  }

  return <CombatantPreviewCard {...previewProps} />
}
