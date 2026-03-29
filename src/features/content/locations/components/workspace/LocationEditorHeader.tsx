import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'

import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types'
import { AppAlert } from '@/ui/primitives'
import { LOCATION_EDITOR_HEADER_HEIGHT_PX } from './locationEditor.constants'

type LocationEditorHeaderProps = {
  title: string
  ancestryBreadcrumbs?: ReactNode
  saving: boolean
  dirty: boolean
  isNew: boolean
  formId?: string
  onSave?: () => void
  onBack: () => void
  errors: ValidationError[]
  success: boolean
  rightRailOpen: boolean
  onToggleRightRail: () => void
  /** Extra actions rendered before the save button (e.g. delete). */
  actions?: ReactNode
}

export function LocationEditorHeader({
  title,
  ancestryBreadcrumbs,
  saving,
  dirty,
  isNew,
  formId,
  onSave,
  onBack,
  errors,
  success,
  rightRailOpen,
  onToggleRightRail,
  actions,
}: LocationEditorHeaderProps) {
  const busy = saving

  return (
    <Box
      sx={{
        height: LOCATION_EDITOR_HEADER_HEIGHT_PX,
        minHeight: LOCATION_EDITOR_HEADER_HEIGHT_PX,
        display: 'flex',
        alignItems: 'center',
        px: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'var(--mui-palette-background-paper)',
        boxSizing: 'border-box',
        gap: 1.5,
      }}
    >
      <Tooltip title="Back to list">
        <IconButton size="small" onClick={onBack} edge="start">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" noWrap lineHeight={1.3}>
          {title}
        </Typography>
        {ancestryBreadcrumbs}
      </Box>

      {success && (
        <AppAlert tone="success" sx={{ py: 0.25, px: 1.5, fontSize: '0.8rem' }}>
          Saved
        </AppAlert>
      )}
      {errors.length > 0 && (
        <AppAlert tone="danger" sx={{ py: 0.25, px: 1.5, fontSize: '0.8rem', maxWidth: 360 }}>
          {errors.map((e) => e.message).join('; ')}
        </AppAlert>
      )}

      <Stack direction="row" spacing={0.5} alignItems="center">
        {actions}

        <Tooltip title={rightRailOpen ? 'Hide settings' : 'Show settings'}>
          <IconButton size="small" onClick={onToggleRightRail}>
            {rightRailOpen ? <ViewSidebarIcon fontSize="small" /> : <ViewSidebarOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Button
          variant="contained"
          size="small"
          disabled={busy || (!dirty && !isNew)}
          {...(formId
            ? { type: 'submit' as const, form: formId }
            : { onClick: onSave })}
        >
          {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
        </Button>
      </Stack>
    </Box>
  )
}
