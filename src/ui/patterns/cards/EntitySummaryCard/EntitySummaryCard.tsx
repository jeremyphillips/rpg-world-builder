import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'

import { InlineStatLine, type InlineStatItem } from './InlineStatLine'

export type EntitySummaryCardProps = {
  avatar: ReactNode
  title: string
  subtitle?: string
  stats?: InlineStatItem[]
  chips?: ReactNode
  isCurrentTurn?: boolean
  secondaryActions?: Array<{
    id: string
    label: string
    disabled?: boolean
    onClick?: () => void
  }>
  primaryAction?: {
    label: string
    disabled?: boolean
    onClick?: () => void
  }
  /** Larger title (e.g. modal rows); default is roster density */
  titleVariant?: 'body2' | 'subtitle2'
}

export function EntitySummaryCard({
  avatar,
  title,
  subtitle,
  stats,
  chips,
  isCurrentTurn = false,
  secondaryActions,
  primaryAction,
  titleVariant = 'subtitle2',
}: EntitySummaryCardProps) {
  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box sx={{ flexShrink: 0, lineHeight: 0 }}>{avatar}</Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant={titleVariant} noWrap sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              {isCurrentTurn && <AppBadge label="Current Turn" tone="success" size="small" />}
            </Stack>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>

          {secondaryActions && secondaryActions.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
              {secondaryActions.map((action) => (
                <IconButton
                  key={action.id}
                  size="small"
                  disabled={action.disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick?.()
                  }}
                  aria-label={action.label}
                  title={action.label}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    {action.label}
                  </Typography>
                </IconButton>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      {stats && stats.length > 0 && <InlineStatLine items={stats} />}

      {chips}

      {primaryAction && (
        <Box sx={{ pt: 0.5, display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <AppBadge
            label={primaryAction.label}
            tone="primary"
            size="small"
            sx={{
              cursor: primaryAction.disabled ? 'default' : 'pointer',
              opacity: primaryAction.disabled ? 0.5 : 1,
            }}
          />
        </Box>
      )}
    </Stack>
  )
}
