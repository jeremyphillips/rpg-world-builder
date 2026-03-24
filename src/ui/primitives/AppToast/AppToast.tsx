import React from 'react'
import Alert from '@mui/material/Alert'
import type { AlertProps } from '@mui/material/Alert'
import Slide from '@mui/material/Slide'
import type { SlideProps } from '@mui/material/Slide'
import Snackbar from '@mui/material/Snackbar'
import type { SnackbarCloseReason } from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'

import { mapAppAlertToneToMuiSeverity, type AppAlertTone } from '../appTone'

function SlideDown(props: SlideProps) {
  return <Slide {...props} direction="down" />
}

export interface AppToastProps {
  open: boolean
  onClose?: () => void
  title: React.ReactNode
  /** Primary narrative lines (body2). */
  children?: React.ReactNode
  /** Dice / mechanics (caption, smaller). */
  mechanics?: React.ReactNode
  tone?: AppAlertTone
  variant?: AlertProps['variant']
  autoHideDuration?: number | null
  sx?: SxProps<Theme>
}

export function AppToast({
  open,
  onClose,
  title,
  children,
  mechanics,
  tone = 'info',
  variant = 'standard',
  autoHideDuration = 8000,
  sx,
}: AppToastProps) {
  return (
    <Snackbar
      open={open}
      onClose={
        onClose
          ? (_, reason: SnackbarCloseReason) => {
              if (reason === 'clickaway') return
              onClose()
            }
          : undefined
      }
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideDown}
      autoHideDuration={autoHideDuration}
      sx={{
        mt: 0,
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        '& .MuiSnackbarContent-root': { p: 0 },
      }}
    >
      <Alert
        severity={mapAppAlertToneToMuiSeverity(tone)}
        variant={variant}
        onClose={onClose}
        sx={[
          {
            px: 4,
            py: 2,
            minHeight: 88,
            alignItems: 'flex-start',
            width: 'min(100vw - 32px, 720px)',
            maxWidth: '100%',
            boxSizing: 'border-box',
          },
          ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
        ]}
      >
        <Stack spacing={0.75} sx={{ width: '100%', minWidth: 0 }}>
          <Typography component="div" variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.35 }}>
            {title}
          </Typography>
          {children ? (
            <Typography component="div" variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
              {children}
            </Typography>
          ) : null}
          {mechanics ? (
            <Typography component="div" variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
              {mechanics}
            </Typography>
          ) : null}
        </Stack>
      </Alert>
    </Snackbar>
  )
}

export default AppToast
