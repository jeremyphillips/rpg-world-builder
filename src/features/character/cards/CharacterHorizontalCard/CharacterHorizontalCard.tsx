import { HorizontalCompactCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'

interface CharacterHorizontalCardProps {
  characterId: string
  name: string
  race?: string
  class: string
  level?: number
  imageUrl?: string
  status?: 'pending' | 'approved'
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const CharacterHorizontalCard = ({
  characterId,
  name,
  race,
  class: className,
  level,
  imageUrl,
  status,
  link,
  isEditable,
  onEdit,
  actions,
}: CharacterHorizontalCardProps) => {
  const subheadline = [race, className, level != null ? `Level ${level}` : undefined]
    .filter(Boolean)
    .join(' · ')
  const badges: CardBadgeProps[] = status ? [{ type: 'status', value: status }] : []

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      subheadline={subheadline}
      badges={badges}
      link={link ?? `/characters/${characterId}`}
      isEditable={isEditable}
      onEdit={onEdit}
      actions={actions}
    />
  )
}

export default CharacterHorizontalCard
