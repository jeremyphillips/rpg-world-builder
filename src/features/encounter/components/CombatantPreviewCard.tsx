import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { AppBadgeTone } from '@/ui/types'
import type { CombatantPreviewCardProps, PreviewTone } from '../domain'

function previewToneToAppBadgeTone(tone: PreviewTone | undefined): AppBadgeTone {
  if (!tone || tone === 'neutral') return 'default'
  return tone
}

export function CombatantPreviewCard({
  id,
  kind,
  mode,
  title,
  subtitle,
  stats,
  chips,
  isCurrentTurn = false,
  isSelected = false,
  isDefeated = false,
  primaryAction,
  secondaryActions,
  onClick,
}: CombatantPreviewCardProps) {
  const borderColor = isCurrentTurn
    ? 'primary.main'
    : isSelected
      ? 'info.main'
      : 'divider'

  const content = (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontWeight: 600 }}
            >
              {title}
            </Typography>
            {isCurrentTurn && (
              <AppBadge label="Current Turn" tone="success" size="small" />
            )}
          </Stack>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" noWrap>
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

      {stats.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {stats.map((stat) => (
            <AppBadge
              key={stat.label}
              label={`${stat.label}: ${stat.value}`}
              tone="default"
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>
      )}

      {chips && chips.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {chips.map((chip) => (
            <AppBadge
              key={chip.id}
              label={chip.label}
              tone={previewToneToAppBadgeTone(chip.tone)}
              size="small"
            />
          ))}
        </Stack>
      )}

      {primaryAction && (
        <Box
          sx={{ pt: 0.5, display: 'flex', justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
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

  return (
    <Paper
      variant="outlined"
      sx={{
        border: '1px solid',
        borderColor,
        opacity: isDefeated ? 0.5 : 1,
        overflow: 'hidden',
      }}
    >
      {onClick ? (
        <ButtonBase
          onClick={onClick}
          sx={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            p: 1.5,
          }}
        >
          {content}
        </ButtonBase>
      ) : (
        <Box sx={{ p: 1.5 }}>{content}</Box>
      )}
    </Paper>
  )
}
