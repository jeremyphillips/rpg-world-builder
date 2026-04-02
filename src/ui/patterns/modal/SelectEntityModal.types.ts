import type { ReactNode } from 'react'

import type { ModalSize } from '../modals/modal.types'

export type SelectEntityOption = {
  id: string
  label: string
  subtitle?: string
  imageUrl?: string | null
  imageKey?: string | null
  stats?: Array<{ label: string; value: string; tooltip?: string }>
}

export type SelectEntityModalProps = {
  open: boolean
  onClose: () => void
  headline: string
  subheadline?: string
  size?: ModalSize
  options: SelectEntityOption[]
  selectedIds: string[]
  onApply: (selectedIds: string[]) => void
  footerNote?: string
  headerSlot?: ReactNode
  /** When `1`, clicking an option replaces selection (single-select). */
  maxSelections?: number
  /** Placeholder for the filter field (default: "Search…"). */
  filterPlaceholder?: string
}
