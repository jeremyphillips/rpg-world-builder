import { useMemo } from 'react'

import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import MonsterAvatar from '@/features/content/monsters/components/MonsterAvatar/MonsterAvatar'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'

import { buildEncounterDefensePreviewChips, type CombatantPreviewCardProps, type PreviewChip, type PreviewStat } from '../../domain'
import {
  CONCENTRATING_BADGE_TOOLTIP,
  formatSigned,
  getPreviewStatTooltip,
  tooltipForConditionMarkerLabel,
} from '../../helpers'
import { CombatantPreviewCard } from '../shared/CombatantPreviewCard'

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
  const { catalog } = useCampaignRules()
  const isDefeated = combatant.stats.currentHitPoints <= 0

  const monster = catalog.monstersById[combatant.source.sourceId]

  const subtitle = useMemo(() => {
    if (monster) return formatMonsterIdentityLine(monster)
    return combatant.creatureType ?? undefined
  }, [combatant.creatureType, monster])

  const stats: PreviewStat[] = [
    { label: 'AC', value: String(combatant.stats.armorClass), tooltip: getPreviewStatTooltip('AC') },
    {
      label: 'HP',
      value: `${combatant.stats.currentHitPoints}/${combatant.stats.maxHitPoints}`,
      tooltip: getPreviewStatTooltip('HP'),
    },
    { label: 'Init', value: formatSigned(combatant.stats.initiativeModifier), tooltip: getPreviewStatTooltip('Init') },
  ]

  const groundSpeed = combatant.stats.speeds?.ground
  if (groundSpeed != null) {
    stats.push({
      label: 'Move',
      value: `${groundSpeed} ft`,
      tooltip: getPreviewStatTooltip('Move'),
    })
  }

  if (combatant.trackedParts && combatant.trackedParts.length > 0) {
    for (const part of combatant.trackedParts) {
      const headOrLimbs = part.part === 'head' ? 'Heads' : 'Limbs'
      stats.push({
        label: headOrLimbs,
        value: `${part.currentCount}/${part.initialCount}`,
        tooltip: getPreviewStatTooltip(headOrLimbs),
      })
    }
  }

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
    kind: 'monster',
    mode: 'active',
    title: combatant.source.label,
    subtitle,
    avatar: <MonsterAvatar name={combatant.source.label} size="sm" />,
    stats,
    chips: chips.length > 0 ? chips : undefined,
    isCurrentTurn,
    isSelected,
    isDefeated,
    onClick,
  }

  return <CombatantPreviewCard {...previewProps} />
}
