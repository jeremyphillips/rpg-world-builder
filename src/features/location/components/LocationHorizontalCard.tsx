import { HorizontalCompactCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'

export interface LocationHorizontalCardProps {
  /** Link to the location detail route */
  link: string
  name: string
  type: string
  description?: string
  imageUrl?: string
  /** Whether this is a user-created location */
  isCustom?: boolean
  /** Parent location name, if nested */
  parentName?: string
}

const LocationHorizontalCard = ({
  link,
  name,
  type,
  description,
  imageUrl,
  isCustom,
  parentName
}: LocationHorizontalCardProps) => {
  const badges: CardBadgeProps[] = [
    { type: 'tag', value: type },
  ]
  if (isCustom) {
    badges.push({ type: 'tag', value: 'Custom' })
  }

  const subheadline = parentName ? `Inside: ${parentName}` : undefined

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      subheadline={subheadline}
      description={description}
      badges={badges}
      link={link}
    />
  )
}

export default LocationHorizontalCard
