import { HorizontalCompactCard } from '@/ui/patterns'
import { CardBadge } from '@/ui/primitives'
import type { CardBadgeProps } from '@/ui/primitives'
import type { CharacterClassSummary } from '@/features/character/read-model'
import { formatCharacterIdentityLine } from '@/features/character/formatters'

interface CharacterHorizontalCardProps {
  characterId: string
  name: string
  race?: { id: string; name: string } | null | undefined
  classes?: CharacterClassSummary[]
  imageUrl?: string
  status?: 'pending' | 'approved'
  campaign?: { id: string; name: string }
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const CharacterHorizontalCard = ({
  characterId,
  name,
  race,
  classes,
  imageUrl,
  campaign,
  status,
  link,
  isEditable,
  onEdit,
  actions,
}: CharacterHorizontalCardProps) => {
  const classLine = formatCharacterIdentityLine(classes ?? [])
  const raceName = race?.name ?? undefined
  const subheadline = [raceName, classLine]
    .filter(Boolean)
    .join(' · ')

  const badgeItems: CardBadgeProps[] = [
    ...(status ? [{ type: 'status', value: status }] : []),
    ...(campaign ? [{ type: 'tag', value: `Campaign: ${campaign.name}` }] : []),
  ] as CardBadgeProps[]

  const titleBadges = (
    <>
      {badgeItems.map((b, i) => (
        <CardBadge key={i} type={b.type} value={b.value} />
      ))}
    </>
  )

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      subheadline={subheadline}
      titleBadges={titleBadges}
      footerActionTo={link ?? `/characters/${characterId}`}
      footerActionLabel="View details"
      footerActionOpenInNewTab={false}
      footerStart={actions}
      isEditable={isEditable}
      onEdit={onEdit}
    />
  )
}

export default CharacterHorizontalCard
