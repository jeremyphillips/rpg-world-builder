import { HorizontalCompactCard } from '@/ui/patterns'
import { CardBadge } from '@/ui/primitives'
import type { CardBadgeProps } from '@/ui/primitives'

export interface LocationHorizontalCardProps {
  /** Location detail route (footer “View details”). */
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
  parentName,
}: LocationHorizontalCardProps) => {
  const badgeItems: CardBadgeProps[] = [
    { type: 'tag', value: type },
  ]
  if (isCustom) {
    badgeItems.push({ type: 'tag', value: 'Custom' })
  }

  const titleBadges = (
    <>
      {badgeItems.map((b, i) => (
        <CardBadge key={i} type={b.type} value={b.value} />
      ))}
    </>
  )

  const subheadline = parentName ? `Inside: ${parentName}` : undefined

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      subheadline={subheadline}
      description={description}
      titleBadges={titleBadges}
      footerActionTo={link}
      footerActionLabel="View details"
      footerActionOpenInNewTab={false}
    />
  )
}

export default LocationHorizontalCard
