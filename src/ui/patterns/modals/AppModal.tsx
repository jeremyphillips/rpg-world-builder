import { useState, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'

import { AppAlert, type AppAlertTone } from '@/ui/primitives'
import type { AppModalProps, CloseReason } from './modal.types'
import { MODAL_SIZE_MAP } from './modal.types'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_DISCARD = {
  headline: 'Discard changes?',
  description: 'You have unsaved changes that will be lost.',
  confirmLabel: 'Discard',
  cancelLabel: 'Keep editing',
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AppModal = ({
  // Visibility
  open,
  onClose,

  // Size
  size = 'standard',

  // Height
  height,
  minHeight,
  maxHeight = '90vh',

  // Header
  headline,
  headlineIcon,
  subheadline,
  showCloseButton = true,
  headerPosition = 'static',

  // Body
  description,
  alert,
  children,
  dividers = true,
  card,
  scroll = 'paper',

  // Footer
  actions,
  primaryAction,
  secondaryAction,
  footerNote,
  footerPosition = 'static',

  // Behavior
  closeOnBackdropClick = true,
  closeOnEsc = true,
  onBeforeClose,
  discardWarning,
  keepMounted = false,
  loading = false,
  mobileFullScreen = false,

  // Escape hatch
  slotProps,

  // Accessibility
  ariaLabel,
}: AppModalProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const fullScreen = mobileFullScreen && isMobile

  const [discardOpen, setDiscardOpen] = useState(false)
  const [blockedReason, setBlockedReason] = useState<CloseReason>('closeButton')

  // -----------------------------------
  // Close handling
  // -----------------------------------

  const attemptClose = useCallback(
    (reason: CloseReason) => {
      if (onBeforeClose && !onBeforeClose(reason)) {
        setBlockedReason(reason)
        setDiscardOpen(true)
        return
      }
      onClose()
    },
    [onBeforeClose, onClose],
  )

  const handleDialogClose = useCallback(
    (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      if (reason === 'backdropClick' && !closeOnBackdropClick) return
      if (reason === 'escapeKeyDown' && !closeOnEsc) return
      attemptClose(reason === 'backdropClick' ? 'backdrop' : 'escape')
    },
    [closeOnBackdropClick, closeOnEsc, attemptClose],
  )

  const handleDiscardConfirm = useCallback(() => {
    setDiscardOpen(false)
    onClose()
  }, [onClose])

  const handleDiscardCancel = useCallback(() => {
    setDiscardOpen(false)
  }, [])

  // -----------------------------------
  // Merge discard warning with defaults
  // -----------------------------------

  const dw = { ...DEFAULT_DISCARD, ...discardWarning }

  // -----------------------------------
  // Determine if header / footer should render
  // -----------------------------------

  const hasHeaderContent = !!(headline || headlineIcon || subheadline)
  const hasHeader = hasHeaderContent || showCloseButton
  const hasFooter = !!(actions || primaryAction || secondaryAction || footerNote)

  // -----------------------------------
  // Floating styles
  // -----------------------------------

  const floatingHeaderSx = headerPosition === 'floating'
    ? {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        background: `linear-gradient(to bottom, ${theme.palette.background.paper} 60%, transparent)`,
        pb: 3,
      }
    : {}

  const floatingFooterSx = footerPosition === 'floating'
    ? {
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        background: `linear-gradient(to top, ${theme.palette.background.paper} 60%, transparent)`,
        pt: 3,
      }
    : {}

  // -----------------------------------
  // Paper sx
  // -----------------------------------

  const paperSx = {
    maxHeight,
    ...(height != null && { height }),
    ...(minHeight != null && { minHeight }),
    borderRadius: 3,
    ...(headerPosition === 'floating' || footerPosition === 'floating'
      ? { position: 'relative' as const, overflow: 'hidden' }
      : {}),
    ...(slotProps?.paper as object ?? {}),
  }

  // -----------------------------------
  // Render
  // -----------------------------------

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth={MODAL_SIZE_MAP[size]}
        fullWidth
        fullScreen={fullScreen}
        scroll={scroll}
        keepMounted={keepMounted}
        aria-label={ariaLabel}
        slotProps={{
          paper: { sx: paperSx },
          ...(slotProps?.backdrop ? { backdrop: { sx: slotProps.backdrop } } : {}),
        }}
      >
        {/* ---- Header ---- */}
        {hasHeader && (
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              pr: showCloseButton ? 6 : undefined,
              ...floatingHeaderSx,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {headlineIcon}
                {headline && (
                  <Typography variant="h6" component="span" fontWeight={600}>
                    {headline}
                  </Typography>
                )}
              </Box>
              {subheadline && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {subheadline}
                </Typography>
              )}
            </Box>

            {showCloseButton && (
              <IconButton
                aria-label="Close"
                onClick={() => attemptClose('closeButton')}
                size="small"
                sx={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </DialogTitle>
        )}

        {/* ---- Body ---- */}
        <DialogContent
          dividers={false}
          sx={{
            opacity: loading ? 0.4 : 1,
            pointerEvents: loading ? 'none' : 'auto',
            transition: 'opacity 0.15s ease',
            // TODO: decide if we want to use dividers
            // ...(dividers && headerPosition === 'static' && hasHeaderContent && {
            //   borderTop: '1px solid var(--mui-palette-divider)',
            // }),
            // ...(dividers && footerPosition === 'static' && hasFooter && {
            //   borderBottom: '1px solid var(--mui-palette-divider)',
            // }),
            ...(headerPosition === 'floating' && { pt: hasHeader ? 8 : undefined }),
            ...(footerPosition === 'floating' && { pb: hasFooter ? 10 : undefined }),
          }}
        >
          {/* Description */}
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>
          )}

          {/* Dynamic alert area */}
          {alert && (
            <AppAlert tone={alert.severity as AppAlertTone} sx={{ mb: 2 }}>
              {alert.message}
            </AppAlert>
          )}

          {/* Card slot */}
          {card && <Box sx={{ mb: 2 }}>{card}</Box>}

          {/* Freeform children */}
          {children}
        </DialogContent>

        {/* ---- Footer ---- */}
        {hasFooter && (
          <DialogActions
            sx={{
              flexDirection: 'column',
              alignItems: 'stretch',
              px: 3,
              py: 2,
              ...floatingFooterSx,
            }}
          >
            {/* Custom actions or shorthand buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, width: '100%' }}>
              {actions ?? (
                <>
                  {secondaryAction && (
                    <Button
                      onClick={secondaryAction.onClick}
                      disabled={secondaryAction.disabled || loading}
                      variant={secondaryAction.variant ?? 'outlined'}
                      color={secondaryAction.color ?? 'secondary'}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                  {primaryAction && (
                    <Button
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.disabled || loading}
                      variant={primaryAction.variant ?? 'contained'}
                      color={primaryAction.color ?? 'primary'}
                      startIcon={
                        primaryAction.loading
                          ? <CircularProgress size={18} color="inherit" />
                          : undefined
                      }
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                </>
              )}
            </Box>

            {/* Footer note */}
            {footerNote && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, textAlign: 'right' }}
              >
                {footerNote}
              </Typography>
            )}
          </DialogActions>
        )}

        {/* Loading overlay indicator */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Dialog>

      {/* ---- Built-in discard warning ---- */}
      <Dialog
        open={discardOpen}
        onClose={handleDiscardCancel}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3 } },
        }}
        sx={{ zIndex: (t) => t.zIndex.modal + 1 }}
      >
        <DialogTitle>{dw.headline}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {dw.description}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDiscardCancel} variant="outlined" color="secondary">
            {dw.cancelLabel}
          </Button>
          <Button onClick={handleDiscardConfirm} variant="contained" color="error">
            {dw.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AppModal
