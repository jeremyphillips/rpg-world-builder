import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export type EncounterContextPromptProps = {
  /** Primary line (e.g. “Use stairs”, “Open door”). */
  title: string
  /** Extra context (e.g. destination floor name, portal label). */
  subtitle?: string | null
  /** Optional leading icon or glyph. */
  icon?: ReactNode
  primaryAction: {
    label: string
    onClick: () => void
  }
  disabled?: boolean
  /** Shown when disabled or as helper text (e.g. insufficient movement). */
  unavailableReason?: string | null
}

/**
 * Generic contextual prompt for encounter / game-session play: movement-adjacent affordances,
 * object interactions, and future transition flows — **not** the standard action deck.
 *
 * TODO: Reuse for ladders, portals, hatches, doors, and inspect/interact world objects; keep API stable.
 */
export function EncounterContextPrompt({
  title,
  subtitle,
  icon,
  primaryAction,
  disabled = false,
  unavailableReason,
}: EncounterContextPromptProps) {
  return (
    <Paper
      square
      elevation={0}
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
        {icon ? <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</Box> : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" component="div" fontWeight={600}>
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
        <Button
          size="small"
          variant="contained"
          disabled={disabled}
          onClick={primaryAction.onClick}
          sx={{ flexShrink: 0 }}
        >
          {primaryAction.label}
        </Button>
      </Stack>
    </Paper>
  )
}
