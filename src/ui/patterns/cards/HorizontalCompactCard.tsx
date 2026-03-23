import { Link } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import type { SxProps, Theme } from '@mui/material/styles'

import MoreVertIcon from '@mui/icons-material/MoreVert'

export type HorizontalCompactTitleVariant = 'subtitle1' | 'body2'

export interface HorizontalCompactCardProps {
  image?: string
  /** Shown when `image` is missing; keeps media column width consistent. */
  imageFallback?: string
  headline: React.ReactNode
  /** Typography variant for the headline row. */
  titleVariant?: HorizontalCompactTitleVariant
  subheadline?: React.ReactNode
  description?: React.ReactNode
  /** Inline with title, end of row (badges). */
  titleBadges?: React.ReactNode
  /** Selection outline (e.g. with `HorizontalCompactActionCard`). */
  selected?: boolean
  footerActionTo?: string
  footerActionLabel?: string
  footerActionOpenInNewTab?: boolean
  /** Leading content in the footer row (e.g. edit affordances). */
  footerStart?: React.ReactNode
  isEditable?: boolean
  onEdit?: () => void
  cardSx?: SxProps<Theme>
}

const HorizontalCompactCard = ({
  image,
  imageFallback,
  headline,
  titleVariant = 'subtitle1',
  subheadline,
  description,
  titleBadges,
  selected = false,
  footerActionTo,
  footerActionLabel = 'View details',
  footerActionOpenInNewTab = false,
  footerStart,
  isEditable,
  onEdit,
  cardSx,
}: HorizontalCompactCardProps) => {
  const mediaSrc = image ?? imageFallback

  const footerLink = footerActionTo ? (
    <Typography
      component={Link}
      to={footerActionTo}
      target={footerActionOpenInNewTab ? '_blank' : undefined}
      rel={footerActionOpenInNewTab ? 'noopener noreferrer' : undefined}
      variant="body2"
      color="primary"
      onClick={(e) => e.stopPropagation()}
      sx={{ fontSize: '0.8125rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
    >
      {footerActionLabel}
    </Typography>
  ) : null

  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        overflow: 'hidden',
        flex: 1,
        minWidth: 0,
        borderColor: selected ? 'primary.main' : 'divider',
        ...cardSx,
      }}
    >
      {mediaSrc != null && mediaSrc !== '' && (
        <CardMedia
          component="img"
          sx={{ width: 100, minWidth: 100, objectFit: 'cover', bgcolor: 'action.hover' }}
          image={mediaSrc}
          alt={typeof headline === 'string' ? headline : ''}
        />
      )}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant={titleVariant} fontWeight={600} noWrap component="div">
              {headline}
            </Typography>
          </Box>
          {titleBadges != null && (
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}
              alignItems="center"
            >
              {titleBadges}
            </Stack>
          )}
        </Stack>
        {subheadline != null && (
          <Box sx={{ mt: 0.25 }}>{subheadline}</Box>
        )}
        {description != null && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            component="div"
          >
            {description}
          </Typography>
        )}
        {(footerStart != null || footerLink != null || (isEditable && onEdit)) && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
              {footerStart}
              {isEditable && onEdit && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                  aria-label="Edit"
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
            {footerLink != null ? <Box sx={{ ml: footerStart != null || (isEditable && onEdit) ? 0 : 'auto' }}>{footerLink}</Box> : null}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export default HorizontalCompactCard
