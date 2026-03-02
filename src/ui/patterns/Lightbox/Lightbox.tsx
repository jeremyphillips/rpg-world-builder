import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'

import CloseIcon from '@mui/icons-material/Close'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LightboxProps {
  /** Whether the lightbox is visible */
  open: boolean
  /** Called when the user closes the lightbox */
  onClose: () => void
  /** Media source URL */
  src: string
  /** Accessible alt text */
  alt?: string
  /** Media type — currently only image is supported */
  mediaType?: 'image'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Lightbox = ({
  open,
  onClose,
  src,
  alt = '',
  mediaType = 'image',
}: LightboxProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    slotProps={{
      paper: {
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'visible',
        },
      },
    }}
  >
    <DialogContent
      sx={{
        p: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Close"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          bgcolor: 'var(--mui-palette-background-paper)',
          boxShadow: 2,
          '&:hover': { bgcolor: 'var(--mui-palette-action-hover)' },
        }}
      >
        <CloseIcon />
      </IconButton>

      {mediaType === 'image' && (
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            maxWidth: '85vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: 1,
          }}
        />
      )}
    </DialogContent>
  </Dialog>
)

export default Lightbox
