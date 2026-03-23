import type { ReactNode } from 'react'

import { HorizontalCompactCard } from '@/ui/patterns'
import { CardBadge } from '@/ui/primitives'
import type { CardBadgeProps } from '@/ui/primitives'

interface CampaignHorizontalCardProps {
  campaignId: string
  name: string
  description?: string
  imageUrl?: string
  /** DM / admin display name */
  dmName?: string
  /** Number of approved campaign members */
  memberCount?: number
  /** Character's in-campaign status ('active' | 'inactive' | 'deceased') */
  characterStatus?: string
  /** Custom actions rendered in the footer leading area (replaces default "View details" link). */
  actions?: ReactNode
}

const STATUS_BADGE_MAP: Record<string, CardBadgeProps> = {
  inactive: { type: 'status', value: 'Inactive' },
  deceased: { type: 'status', value: 'Deceased' },
}

const CampaignHorizontalCard = ({
  campaignId,
  name,
  description,
  imageUrl,
  dmName,
  memberCount,
  characterStatus,
  actions: customActions,
}: CampaignHorizontalCardProps) => {
  const memberLabel = memberCount != null
    ? `${memberCount} member${memberCount !== 1 ? 's' : ''}`
    : undefined

  const subheadline = [memberLabel].filter(Boolean).join(' · ')

  const badgeItems: CardBadgeProps[] = []
  if (dmName) badgeItems.push({ type: 'role', value: `DM: ${dmName}` })
  if (characterStatus && STATUS_BADGE_MAP[characterStatus]) {
    badgeItems.push(STATUS_BADGE_MAP[characterStatus])
  }

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
      subheadline={subheadline || undefined}
      description={description}
      titleBadges={titleBadges}
      footerActionTo={customActions ? undefined : `/campaigns/${campaignId}`}
      footerActionLabel="View details"
      footerActionOpenInNewTab={false}
      footerStart={customActions}
    />
  )
}

export default CampaignHorizontalCard
