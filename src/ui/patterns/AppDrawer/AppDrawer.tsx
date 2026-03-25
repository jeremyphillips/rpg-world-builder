import type { ReactNode } from 'react'
import { useEffect } from 'react'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'

export type AppDrawerProps = {
  open: boolean
  onClose: () => void
  anchor?: 'left' | 'right'
  title?: string
  width?: number
  children: ReactNode
  /**
   * Side panel mode: no backdrop, battlefield stays clickable, no outside-click close.
   * Escape and the header close button still dismiss. (Used for combat action UI.)
   */
  nonModal?: boolean
}

export function AppDrawer({
  open,
  onClose,
  anchor = 'right',
  title,
  width = 400,
  children,
  nonModal = false,
}: AppDrawerProps) {
  // When nonModal, focus may be on the grid; MUI Modal's key handler on the portal root
  // would not run. Listen on document so Escape always closes intentionally.
  useEffect(() => {
    if (!open || !nonModal) return
    const onDocKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      onClose()
    }
    document.addEventListener('keydown', onDocKeyDown)
    return () => document.removeEventListener('keydown', onDocKeyDown)
  }, [open, nonModal, onClose])

  return (
    <Drawer
      variant="temporary"
      anchor={anchor}
      open={open}
      onClose={nonModal ? (_event, reason) => reason !== 'backdropClick' && onClose() : onClose}
      hideBackdrop={nonModal}
      disableEscapeKeyDown={nonModal}
      disableScrollLock={nonModal}
      disableEnforceFocus={nonModal}
      disableAutoFocus={nonModal}
      slotProps={{
        root: nonModal
          ? {
              sx: { pointerEvents: 'none' },
            }
          : undefined,
        paper: {
          sx: {
            width,
            maxWidth: '100vw',
            ...(nonModal ? { pointerEvents: 'auto' } : {}),
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}
      >
        {title ? (
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        ) : (
          <Box />
        )}
        <IconButton size="small" onClick={onClose} aria-label="Close drawer">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto' }}>{children}</Box>
    </Drawer>
  )
}
