import { Link } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import { AppAvatar } from '@/ui/primitives'
import type { AppAvatarProps } from '@/ui/primitives'
import { CardBadge } from '@/ui/primitives'

export interface CardBadgeItem {
  type: 'status' | 'tag' | 'role'
  value: string
}

export interface TimelineCardProps {
  avatar?: AppAvatarProps | AppAvatarProps[]
  headline: string
  timestamp?: string
  description?: string
  badges?: CardBadgeItem[]
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const TimelineCard = ({
  avatar,
  headline,
  timestamp,
  description,
  badges = [],
  link,
  actions,
}: TimelineCardProps) => {
  const avatars = avatar ? (Array.isArray(avatar) ? avatar : [avatar]) : []

  const content = (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {avatars.length > 0 && (
            <Stack direction="row" spacing={-1} sx={{ flexShrink: 0 }}>
              {avatars.map((a, i) => (
                <AppAvatar key={i} {...a} size={a.size ?? 'md'} />
              ))}
            </Stack>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {headline}
            </Typography>
            {timestamp && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {timestamp}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
        {(badges.length > 0 || actions) && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {badges.map((b, i) => (
                <CardBadge key={i} type={b.type} value={b.value} />
              ))}
            </Stack>
            {actions}
          </Stack>
        )}
      </CardContent>
    </Card>
  )

  if (link) {
    return (
      <Box component={Link} to={link} sx={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Box>
    )
  }

  return content
}

export default TimelineCard
