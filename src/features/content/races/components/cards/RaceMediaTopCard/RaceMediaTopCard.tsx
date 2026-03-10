import { MediaTopCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'

interface RaceMediaTopCardProps {
  raceId?: string
  name: string
  subheadline?: string
  description?: string
  imageUrl?: string
  badges?: CardBadgeProps[]
  attribution?: string
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const RaceMediaTopCard = ({
  name,
  subheadline,
  description,
  imageUrl,
  badges = [],
  attribution,
  link,
  isEditable,
  onEdit,
  actions,
}: RaceMediaTopCardProps) => (
  <MediaTopCard
    image={imageUrl}
    headline={name}
    subheadline={subheadline}
    description={description}
    badges={badges}
    attribution={attribution}
    link={link}
    isEditable={isEditable}
    onEdit={onEdit}
    actions={actions}
  />
)

export default RaceMediaTopCard
