import type { ReactNode, RefObject } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ButtonProps } from '@mui/material/Button'
import type { AlertColor } from '@mui/material/Alert'
import type { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form'
import type { FieldConfig } from '@/ui/patterns'

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type ModalSize = 'compact' | 'standard' | 'wide' | 'full'

export type CloseReason = 'backdrop' | 'escape' | 'closeButton'

export type ModalAction = {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  color?: ButtonProps['color']
  variant?: ButtonProps['variant']
}

export type DiscardWarning = {
  headline?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

// ---------------------------------------------------------------------------
// Size → MUI maxWidth mapping
// ---------------------------------------------------------------------------

export const MODAL_SIZE_MAP: Record<ModalSize, 'xs' | 'sm' | 'md' | 'lg'> = {
  compact: 'xs',
  standard: 'sm',
  wide: 'md',
  full: 'lg',
}

// ---------------------------------------------------------------------------
// AppModal
// ---------------------------------------------------------------------------

export interface AppModalProps {
  // --- Visibility ---
  open: boolean
  onClose: () => void

  // --- Size ---
  size?: ModalSize

  // --- Height ---
  height?: string | number
  minHeight?: string | number
  maxHeight?: string | number

  // --- Header ---
  headline?: string
  headlineIcon?: ReactNode
  subheadline?: string
  showCloseButton?: boolean
  headerPosition?: 'static' | 'floating'

  // --- Body ---
  description?: string
  alert?: { severity: AlertColor; message: string }
  children?: ReactNode
  dividers?: boolean
  card?: ReactNode
  scroll?: 'paper' | 'body'

  // --- Footer ---
  actions?: ReactNode
  primaryAction?: ModalAction
  secondaryAction?: ModalAction
  footerNote?: string
  footerPosition?: 'static' | 'floating'

  // --- Behavior ---
  closeOnBackdropClick?: boolean
  closeOnEsc?: boolean
  onBeforeClose?: (reason: CloseReason) => boolean
  discardWarning?: DiscardWarning
  keepMounted?: boolean
  loading?: boolean
  mobileFullScreen?: boolean

  // --- Escape hatch ---
  slotProps?: {
    paper?: SxProps<Theme>
    backdrop?: SxProps<Theme>
  }

  // --- Accessibility ---
  ariaLabel?: string
}

// ---------------------------------------------------------------------------
// ConfirmModal
// ---------------------------------------------------------------------------

export interface ConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  headline: string
  headlineIcon?: ReactNode
  description?: string
  /** Rich content rendered below the description */
  children?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: ButtonProps['color']
  loading?: boolean
  size?: ModalSize
}

// ---------------------------------------------------------------------------
// FormModal
// ---------------------------------------------------------------------------

export interface FormModalProps<T extends FieldValues> {
  open: boolean
  onClose: () => void
  onSubmit: (data: T) => void | Promise<void>
  headline: string
  headlineIcon?: ReactNode
  subheadline?: string
  description?: string
  fields: FieldConfig[]
  defaultValues: DefaultValues<T>
  submitLabel?: string
  cancelLabel?: string
  size?: ModalSize
  loading?: boolean
  formRef?: RefObject<UseFormReturn<T> | null>
  preventCloseOnDirty?: boolean
  discardWarning?: DiscardWarning
  footerNote?: string
  alert?: { severity: AlertColor; message: string }
}
