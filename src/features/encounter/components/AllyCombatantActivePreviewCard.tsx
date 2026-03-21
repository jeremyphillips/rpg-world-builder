import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { buildEncounterDefensePreviewChips, type CombatantPreviewCardProps, type PreviewChip, type PreviewStat } from '../domain'
import {
  CONCENTRATING_BADGE_TOOLTIP,
  formatSigned,
  getPreviewStatTooltip,
  tooltipForConditionMarkerLabel,
} from '../helpers'
import { CombatantPreviewCard } from './CombatantPreviewCard'

type AllyCombatantActivePreviewCardProps = {
  combatant: CombatantInstance
  isCurrentTurn?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function AllyCombatantActivePreviewCard({
  combatant,
  isCurrentTurn = false,
  isSelected = false,
  onClick,
}: AllyCombatantActivePreviewCardProps) {
  const isDefeated = combatant.stats.currentHitPoints <= 0

  const stats: PreviewStat[] = [
    { label: 'AC', value: String(combatant.stats.armorClass), tooltip: getPreviewStatTooltip('AC') },
    {
      label: 'HP',
      value: `${combatant.stats.currentHitPoints}/${combatant.stats.maxHitPoints}`,
      tooltip: getPreviewStatTooltip('HP'),
    },
    { label: 'Init', value: formatSigned(combatant.stats.initiativeModifier), tooltip: getPreviewStatTooltip('Init') },
  ]

  const chips: PreviewChip[] = [
    ...(combatant.concentration
      ? [
          {
            id: 'concentrating',
            label: 'Concentrating',
            tone: 'info' as const,
            tooltip: CONCENTRATING_BADGE_TOOLTIP,
          },
        ]
      : []),
    ...combatant.conditions.map((c) => ({
      id: c.id,
      label: c.label,
      tone: 'warning' as const,
      tooltip: tooltipForConditionMarkerLabel(c.label),
    })),
    ...combatant.states.map((s) => ({ id: s.id, label: s.label, tone: 'info' as const })),
    ...buildEncounterDefensePreviewChips(combatant),
  ]

  const previewProps: CombatantPreviewCardProps = {
    id: combatant.instanceId,
    kind: 'character',
    mode: 'active',
    title: combatant.source.label,
    subtitle: combatant.source.kind === 'npc' ? 'NPC' : undefined,
    stats,
    chips: chips.length > 0 ? chips : undefined,
    isCurrentTurn,
    isSelected,
    isDefeated,
    onClick,
  }

  return <CombatantPreviewCard {...previewProps} />
}
