import { Link } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import { CardBadge, type CardBadgeProps } from '@/ui/primitives'
import { UserAvatar } from '@/features/user/components'

export interface MediaTopCardProps {
  image?: string
  /** Rendered in place of CardMedia when `image` is falsy */
  imageFallback?: React.ReactNode
  headline: string
  subheadline?: string
  description?: string
  badges?: CardBadgeProps[]
  attribution?: string | { name: string; imageUrl?: string }
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const MediaTopCard = ({
  image,
  imageFallback,
  headline,
  subheadline,
  description,
  badges = [],
  attribution,
  link,
  isEditable,
  onEdit,
  actions,
}: MediaTopCardProps) => {
  const content = (
    <Card sx={{ overflow: 'hidden' }}>
      {image ? (
        <CardMedia
          component="img"
          height="180"
          image={image}
          alt={headline}
          sx={{ objectFit: 'cover' }}
        />
      ) : imageFallback ? (
        imageFallback
      ) : null}
      <CardContent>
        <Typography variant="h6" component="h2" fontWeight={600}>
          {headline}
        </Typography>
        {subheadline && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subheadline}
          </Typography>
        )}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {description}
          </Typography>
        )}
        {badges.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1.5 }}>
            {badges.map((b, i) => (
              <CardBadge key={i} type={b.type} value={b.value} tone={b.tone} />
            ))}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {attribution && (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
              {typeof attribution === 'object' && attribution.imageUrl && (
                <UserAvatar username={attribution.name} avatarUrl={attribution.imageUrl} size="xs" />
              )}
              <Typography variant="caption" color="text.secondary" noWrap>
                {typeof attribution === 'string' ? attribution : attribution.name}
              </Typography>
            </Stack>
          )}
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          {actions}
          {isEditable && onEdit && (
            <IconButton size="small" onClick={onEdit} aria-label="Edit">
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </CardActions>
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

export default MediaTopCard
