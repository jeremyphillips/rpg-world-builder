import { TimelineCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'

interface CharacterTimelineCardProps {
  characterId: string
  name: string
  imageUrl?: string
  timestamp?: string
  description?: string
  status?: 'pending' | 'approved'
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const CharacterTimelineCard = ({
  characterId,
  name,
  imageUrl,
  timestamp,
  description,
  status,
  link,
  isEditable,
  onEdit,
  actions,
}: CharacterTimelineCardProps) => {
  const badges: CardBadgeProps[] = status ? [{ type: 'status', value: status }] : []

  return (
    <TimelineCard
      avatar={{ src: imageUrl, name }}
      headline={name}
      timestamp={timestamp}
      description={description}
      badges={badges}
      link={link ?? `/characters/${characterId}`}
      isEditable={isEditable}
      onEdit={onEdit}
      actions={actions}
    />
  )
}

export default CharacterTimelineCard
