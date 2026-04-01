import type { ReactNode } from 'react'

import type {
  CombatantPreviewAction,
  CombatantPreviewKind,
  CombatantPreviewMode,
  PreviewChip,
  PreviewStat,
  ViewerCombatantPresentationKind,
} from '@/features/mechanics/domain/combat/presentation/view/tactical-preview.types'

/** Client combat UI: preview card props include a React avatar slot; data-first types live under mechanics combat presentation. */
export type CombatantPreviewCardProps = {
  id: string
  kind: CombatantPreviewKind
  mode: CombatantPreviewMode
  title: string
  subtitle?: string
  /** Leading avatar; when omitted, a neutral placeholder is shown. */
  avatar?: ReactNode
  stats: PreviewStat[]
  chips?: PreviewChip[]
  isCurrentTurn?: boolean
  isSelected?: boolean
  isDefeated?: boolean
  /**
   * When false, dim the card like defeated (banished / off-grid). Defaults to true when omitted (e.g. setup roster).
   */
  hasBattlefieldPresence?: boolean
  /** Bookkeeping UI dim/chip; defaults to `visible` when omitted (e.g. setup roster). */
  viewerPresentationKind?: ViewerCombatantPresentationKind
  primaryAction?: CombatantPreviewAction
  secondaryActions?: CombatantPreviewAction[]
  onClick?: () => void
}
