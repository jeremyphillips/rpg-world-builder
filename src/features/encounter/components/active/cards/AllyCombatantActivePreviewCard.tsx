import { useMemo } from 'react'

import type { Monster } from '@/features/content/monsters/domain/types'
import type { CombatantPortraitEntry } from '@/features/encounter/helpers/resolveCombatantAvatarSrc'
import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/encounter/state'
import { formatCharacterDetailSubtitle } from '@/features/character/formatters'
import { useCharacter } from '@/features/character/hooks'

import type { CombatantPreviewCardProps, PreviewStat } from '../../../domain'
import { buildCombatantPreviewChips, formatSigned, getPreviewStatTooltip } from '../../../helpers'
import { CombatantPreviewCard } from '../../shared/cards/CombatantPreviewCard'
import { CombatantAvatar } from '../../shared/CombatantAvatar'

type AllyCombatantActivePreviewCardProps = {
  combatant: CombatantInstance
  monstersById: Record<string, Monster>
  characterPortraitById: Record<string, CombatantPortraitEntry>
  /** When set, title and fallback avatar use duplicate-aware labels. */
  allCombatants?: readonly CombatantInstance[]
  isCurrentTurn?: boolean
  isSelected?: boolean
  showChips?: boolean
  onClick?: () => void
}

export function AllyCombatantActivePreviewCard({
  combatant,
  monstersById,
  characterPortraitById,
  allCombatants,
  isCurrentTurn = false,
  isSelected = false,
  showChips = true,
  onClick,
}: AllyCombatantActivePreviewCardProps) {
  const isDefeated = combatant.stats.currentHitPoints <= 0

  const title = useMemo(
    () =>
      allCombatants && allCombatants.length > 0
        ? getCombatantDisplayLabel(combatant, allCombatants)
        : combatant.source.label,
    [allCombatants, combatant],
  )

  const characterId =
    combatant.source.kind === 'pc' || combatant.source.kind === 'npc'
      ? combatant.source.sourceId
      : undefined
  const { character } = useCharacter(characterId)

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

  const chips = buildCombatantPreviewChips(combatant)

  const subtitle = character ? formatCharacterDetailSubtitle(character) : undefined

  const portraitOverride = character
    ? { imageKey: character.imageKey, imageUrl: character.imageUrl }
    : undefined

  const avatar = (
    <CombatantAvatar
      combatant={combatant}
      monstersById={monstersById}
      characterPortraitById={characterPortraitById}
      portraitOverride={portraitOverride}
      displayName={title}
      size="sm"
    />
  )

  const previewProps: CombatantPreviewCardProps = {
    id: combatant.instanceId,
    kind: 'character',
    mode: 'active',
    title,
    subtitle,
    avatar,
    stats,
    chips: showChips && chips.length > 0 ? chips : undefined,
    isCurrentTurn,
    isSelected,
    isDefeated,
    onClick,
  }

  return <CombatantPreviewCard {...previewProps} />
}
