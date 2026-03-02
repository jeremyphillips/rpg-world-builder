import { MediaTopCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'

interface MonsterMediaTopCardProps {
  name: string
  type: string
  subtype?: string
  sizeCategory?: string
  description?: string
  imageUrl?: string
  badges?: CardBadgeProps[]
  attribution?: string
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const MonsterMediaTopCard = ({
  name,
  type,
  subtype,
  sizeCategory,
  description,
  imageUrl,
  badges = [],
  attribution,
  link,
  isEditable,
  onEdit,
  actions,
}: MonsterMediaTopCardProps) => {
  const subheadline = [type, subtype, sizeCategory].filter(Boolean).join(' · ')

  const cardActions = (
    <>
      {actions}
      {/* {link && (
        <Button component="span" size="small" variant="outlined">
          View Detail
        </Button>
      )} */}
    </>
  )

  return (
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
      actions={cardActions}
    />
  )
}

export default MonsterMediaTopCard
