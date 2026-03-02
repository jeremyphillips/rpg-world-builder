import type { ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import { HorizontalCompactCard } from '@/ui/patterns'
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
  /** Custom actions rendered in the card's action area (replaces default "View details") */
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

  const badges: CardBadgeProps[] = []
  if (dmName) badges.push({ type: 'role', value: `DM: ${dmName}` })
  if (characterStatus && STATUS_BADGE_MAP[characterStatus]) {
    badges.push(STATUS_BADGE_MAP[characterStatus])
  }

  return (
    <HorizontalCompactCard
      image={imageUrl}
      headline={name}
      subheadline={subheadline || undefined}
      description={description}
      badges={badges}
      link={`/campaigns/${campaignId}`}
      actions={
        customActions ?? (
          <Typography variant="body2" color="primary" sx={{ fontSize: '0.8125rem' }}>
            View details
          </Typography>
        )
      }
    />
  )
}

export default CampaignHorizontalCard
