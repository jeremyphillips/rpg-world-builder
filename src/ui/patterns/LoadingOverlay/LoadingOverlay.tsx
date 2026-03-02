import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  open: boolean
  /** Primary message shown below the spinner */
  headline?: string
  /** Secondary message shown below the headline */
  subtext?: string
  /** Spinner size in pixels (default 48) */
  spinnerSize?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LoadingOverlay = ({
  open,
  headline,
  subtext,
  spinnerSize = 48,
}: LoadingOverlayProps) => (
  <Dialog
    open={open}
    slotProps={{
      paper: {
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      },
      backdrop: {
        sx: { bgcolor: 'rgba(0,0,0,0.7)' },
      },
    }}
  >
    <DialogContent>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={spinnerSize} sx={{ color: '#fff' }} />
        {headline && (
          <Typography variant="h6" sx={{ color: '#fff' }} fontWeight={600}>
            {headline}
          </Typography>
        )}
        {subtext && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {subtext}
          </Typography>
        )}
      </Stack>
    </DialogContent>
  </Dialog>
)

export default LoadingOverlay
