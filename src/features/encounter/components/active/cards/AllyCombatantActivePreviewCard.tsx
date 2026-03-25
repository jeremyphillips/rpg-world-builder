import type { CombatantInstance } from '@/features/mechanics/domain/encounter'
import CharacterAvatar from '@/features/character/components/CharacterAvatar'
import { formatCharacterDetailSubtitle } from '@/features/character/formatters'
import { useCharacter } from '@/features/character/hooks'
import { AppAvatar } from '@/ui/primitives'

import type { CombatantPreviewCardProps, PreviewStat } from '../../../domain'
import { buildCombatantPreviewChips, formatSigned, getPreviewStatTooltip } from '../../../helpers'
import { CombatantPreviewCard } from '../../shared/cards/CombatantPreviewCard'

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

  const avatar = character ? (
    <CharacterAvatar imageUrl={character.imageUrl ?? undefined} name={character.name} size="sm" />
  ) : (
    <AppAvatar name={combatant.source.label} size="sm" />
  )

  const previewProps: CombatantPreviewCardProps = {
    id: combatant.instanceId,
    kind: 'character',
    mode: 'active',
    title: combatant.source.label,
    subtitle,
    avatar,
    stats,
    chips: chips.length > 0 ? chips : undefined,
    isCurrentTurn,
    isSelected,
    isDefeated,
    onClick,
  }

  return <CombatantPreviewCard {...previewProps} />
}
