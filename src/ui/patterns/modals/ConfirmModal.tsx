import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import AppModal from './AppModal'
import type { ConfirmModalProps } from './modal.types'

// ---------------------------------------------------------------------------
// ConfirmModal — preset wrapping AppModal for confirm / cancel flows
// ---------------------------------------------------------------------------

const ConfirmModal = ({
  open,
  onConfirm,
  onCancel,
  headline,
  headlineIcon,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  loading = false,
  size = 'compact',
}: ConfirmModalProps) => (
  <AppModal
    open={open}
    onClose={onCancel}
    size={size}
    headline={headline}
    headlineIcon={headlineIcon}
    description={description}
    showCloseButton={false}
    closeOnBackdropClick={!loading}
    closeOnEsc={!loading}
    loading={loading}
    actions={
      <>
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outlined"
          color="secondary"
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          startIcon={
            loading ? <CircularProgress size={18} color="inherit" /> : undefined
          }
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    {children}
  </AppModal>
)

export default ConfirmModal
