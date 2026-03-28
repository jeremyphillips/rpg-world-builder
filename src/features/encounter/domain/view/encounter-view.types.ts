import type { ReactNode } from 'react'

import type { CombatStatePriority } from '../effects/presentable-effects.types'

export type CombatantPreviewMode = 'setup' | 'active'
export type CombatantPreviewKind = 'character' | 'monster'

/**
 * Viewer-relative **presentation** for a combatant (sidebar, initiative, header, grid metadata).
 * Derived only from existing rule seams — not a second visibility engine.
 *
 * Future: may extend with e.g. `guessed-position` when awareness presentation ships; render can then
 * branch without changing `canPerceiveTargetOccupantForCombat` / stealth reconciliation.
 */
export type ViewerCombatantPresentationKind = 'visible' | 'out-of-sight' | 'hidden'

export type PreviewTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success'

export type PreviewChip = {
  id: string
  label: string
  tone?: PreviewTone
  tooltip?: string
  priority?: CombatStatePriority
  /** Compact duration display, e.g. `"6s/60s"` or `"18s left"`. */
  timeLabel?: string
}

/** Core stat line (AC, HP, …); shared by preview and active combatant cards. */
export type CombatantStatBadge = {
  label: string
  value: string
  tooltip?: string
}

export type PreviewStat = CombatantStatBadge

/** Tracked resource row (e.g. heads/limbs) on the active card. */
export type CombatantTrackedPartBadge = {
  label: string
  current: number
  initial: number
  tooltip?: string
}

export type CombatantPreviewAction = {
  id: string
  label: string
  disabled?: boolean
  onClick?: () => void
}

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

export type CharacterCombatant = {
  id: string
  name: string
  race?: string
  className?: string
  level?: number
  armorClass?: number
  hitPoints?: { current: number; max: number }
  initiativeModifier?: number
  movement?: { current?: number; max?: number }
  criticalStates?: Array<{ id: string; label: string; tone?: PreviewTone }>
}

export type MonsterCombatant = {
  id: string
  name: string
  creatureType?: string
  challengeRating: string
  armorClass?: number
  hitPoints?: { current: number; max: number }
  initiativeModifier?: number
  movement?: { current?: number; max?: number }
  criticalStates?: Array<{ id: string; label: string; tone?: PreviewTone }>
}

export type SetupPreviewWrapperProps<TCombatant> = {
  combatant: TCombatant
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export type ActivePreviewWrapperProps<TCombatant> = {
  combatant: TCombatant
  isCurrentTurn?: boolean
  isSelected?: boolean
  onClick?: () => void
  onInspect?: () => void
}

export type TurnOrderStatus =
  | 'current'
  | 'next'
  | 'upcoming'
  | 'acted'
  | 'delayed'
  | 'defeated'
