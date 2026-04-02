import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'

export type SelectedEntitiesLaneProps = {
  title: string
  description?: string
  actionLabel: string
  onAction: () => void
  emptyMessage: string
  hasSelection: boolean
  children?: ReactNode
  /** When true, the primary action button is disabled. */
  actionDisabled?: boolean
}

/**
 * Layout for a titled section with an add/select action, empty state, and a slot for selected entity content.
 * Pair with {@link SelectEntityModal} or similar: the action opens selection; children render domain-specific cards.
 */
export function SelectedEntitiesLane({
  title,
  description,
  actionLabel,
  onAction,
  emptyMessage,
  hasSelection,
  children,
  actionDisabled = false,
}: SelectedEntitiesLaneProps) {
  return (
    <Paper sx={{ p: 3, minHeight: 320 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AddIcon />}
          onClick={onAction}
          disabled={actionDisabled}
        >
          {actionLabel}
        </Button>
        {hasSelection ? children : (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        )}
      </Stack>
    </Paper>
  )
}
