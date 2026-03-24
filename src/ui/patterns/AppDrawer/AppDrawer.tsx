import type { ReactNode } from 'react'

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
}

export function AppDrawer({
  open,
  onClose,
  anchor = 'right',
  title,
  width = 400,
  children,
}: AppDrawerProps) {
  return (
    <Drawer
      variant="temporary"
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width,
            maxWidth: '100vw',
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
