import { Link } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { CardBadge, type CardBadgeProps } from '@/ui/primitives'

import MoreVertIcon from '@mui/icons-material/MoreVert'

export interface HorizontalCompactCardProps {
  image?: string
  headline: string
  subheadline?: string
  description?: string
  badges?: CardBadgeProps[]
  link?: string
  isEditable?: boolean
  onEdit?: () => void
  actions?: React.ReactNode
}

const HorizontalCompactCard = ({
  image,
  headline,
  subheadline,
  description,
  badges = [],
  link,
  isEditable,
  onEdit,
  actions,
}: HorizontalCompactCardProps) => {
  const content = (
    <Card sx={{ display: 'flex', overflow: 'hidden' }}>
      {image && (
        <CardMedia
          component="img"
          sx={{ width: 100, minWidth: 100, objectFit: 'cover' }}
          image={image}
          alt={headline}
        />
      )}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, py: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {headline}
        </Typography>
        {subheadline && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {subheadline}
          </Typography>
        )}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {description}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {badges.map((b, i) => (
              <CardBadge key={i} type={b.type} value={b.value} />
            ))}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {actions}
            {isEditable && onEdit && (
              <IconButton size="small" onClick={onEdit} aria-label="Edit">
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Stack>
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

export default HorizontalCompactCard
