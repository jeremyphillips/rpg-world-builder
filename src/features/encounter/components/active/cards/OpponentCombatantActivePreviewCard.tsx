import { useMemo } from 'react'

import type { Monster } from '@/features/content/monsters/domain/types'
import { formatMonsterIdentityLine } from '@/features/content/monsters/formatters'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/combatants'
import type { ViewerCombatantPresentationKind } from '@/features/encounter/domain'
import type { CombatantInstance, SpatialBattlefieldPresentationOptions } from '@/features/mechanics/domain/encounter'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/encounter/state'
import {
  hasBattlefieldPresence,
  isDefeatedCombatant,
} from '@/features/mechanics/domain/encounter/state/combatants/combatant-participation'

import type { CombatantPreviewCardProps, PreviewStat } from '../../../domain'
import { formatSigned } from '@/features/encounter/helpers/combatants'
import { buildCombatantPreviewChips, getPreviewStatTooltip } from '@/features/encounter/helpers/presentation'
import { CombatantPreviewCard } from '../../shared/cards/CombatantPreviewCard'
import { CombatantAvatar } from '../../shared/CombatantAvatar'

type OpponentCombatantActivePreviewCardProps = {
  combatant: CombatantInstance
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
  allCombatants?: readonly CombatantInstance[]
  isCurrentTurn?: boolean
  isSelected?: boolean
  showChips?: boolean
  onClick?: () => void
  spatialPresentation?: SpatialBattlefieldPresentationOptions
  viewerPresentationKind?: ViewerCombatantPresentationKind
}

export function OpponentCombatantActivePreviewCard({
  combatant,
  monstersById,
  characterPortraitById,
  allCombatants,
  isCurrentTurn = false,
  isSelected = false,
  showChips = true,
  onClick,
  spatialPresentation,
  viewerPresentationKind = 'visible',
}: OpponentCombatantActivePreviewCardProps) {
  const isDefeated = isDefeatedCombatant(combatant)
  const onBattlefield = hasBattlefieldPresence(combatant)

  const title = useMemo(
    () =>
      allCombatants && allCombatants.length > 0
        ? getCombatantDisplayLabel(combatant, allCombatants)
        : combatant.source.label,
    [allCombatants, combatant],
  )

  const monster = monstersById[combatant.source.sourceId]

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

  const chips = buildCombatantPreviewChips(combatant, { spatial: spatialPresentation })

  const previewProps: CombatantPreviewCardProps = {
    id: combatant.instanceId,
    kind: 'monster',
    mode: 'active',
    title,
    subtitle,
    avatar: (
      <CombatantAvatar
        combatant={combatant}
        monstersById={monstersById}
        characterPortraitById={characterPortraitById}
        displayName={title}
        size="sm"
      />
    ),
    stats,
    chips: showChips && chips.length > 0 ? chips : undefined,
    isCurrentTurn,
    isSelected,
    isDefeated,
    hasBattlefieldPresence: onBattlefield,
    viewerPresentationKind,
    onClick,
  }

  return <CombatantPreviewCard {...previewProps} />
}
