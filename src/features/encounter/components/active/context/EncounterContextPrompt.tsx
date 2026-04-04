import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export type EncounterContextPromptProps = {
  /** Primary line (turn guidance, “Use stairs”, “Open door”, etc.). */
  title: string
  /** Extra context (e.g. destination floor name, portal label). */
  subtitle?: string | null
  /** Optional leading icon or glyph. */
  icon?: ReactNode
  /**
   * Primary affordance. When omitted, the strip is informational only (movement/turn hints,
   * passive context) — no action control is shown.
   */
  primaryAction?: {
    label: string
    onClick: () => void
  }
  disabled?: boolean
  /** Shown when disabled or as helper text (e.g. insufficient movement, wrong seat). */
  unavailableReason?: string | null
  /** Title emphasis (e.g. exhausted resources — matches prior header directive treatment). */
  titleTone?: 'default' | 'warning'
}

/**
 * Shared **under-header** contextual strip for active encounter play: turn/movement guidance,
 * grid-context hints, and optional affordances (stairs, future portals/ladders) — **not** the action deck.
 */
export function EncounterContextPrompt({
  title,
  subtitle,
  icon,
  primaryAction,
  disabled = false,
  unavailableReason,
  titleTone = 'default',
}: EncounterContextPromptProps) {
  const actionable = Boolean(primaryAction)
  return (
    <Paper
      square
      elevation={0}
      role="status"
      aria-live="polite"
      sx={{
        px: 2,
        py: actionable ? 1.5 : 1.25,
        minHeight: actionable ? 52 : 44,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
        transition: (theme) =>
          theme.transitions.create(['min-height', 'padding'], { duration: theme.transitions.duration.shorter }),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
        {icon ? <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</Box> : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            component="div"
            fontWeight={600}
            sx={titleTone === 'warning' ? { color: 'warning.main' } : undefined}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" component="div">
              {subtitle}
            </Typography>
          ) : null}
          {unavailableReason ? (
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }}>
              {unavailableReason}
            </Typography>
          ) : null}
        </Box>
        {primaryAction ? (
          <Button
            size="small"
            variant="contained"
            disabled={disabled}
            onClick={primaryAction.onClick}
            sx={{ flexShrink: 0 }}
          >
            {primaryAction.label}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  )
}
