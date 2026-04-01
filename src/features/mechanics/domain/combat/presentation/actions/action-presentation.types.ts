import type { ActionBadgeDescriptor } from '../badges/action/combat-action-badges.types'

/**
 * Primary user-intent category for an action.
 * Drives grouping in action lists. Distinct from {@link ActionSourceTag} (origin metadata)
 * and from `CombatActionKind` (raw mechanical kind).
 */
export type ActionSemanticCategory =
  | 'attack'
  | 'utility'
  | 'heal'
  | 'buff'
  | 'item'

/**
 * Origin/source of an action. Separate axis from {@link ActionSemanticCategory}.
 * Not used for primary grouping; reserved for future source-filter chips/tabs.
 */
export type ActionSourceTag =
  | 'weapon'
  | 'spell'
  | 'natural'
  | 'feature'
  | 'item'

export type ActionFooterLink = {
  /** Route-template path with :id placeholder for campaignId still present when spellId-based. */
  spellId?: string
  label: string
}

/**
 * Presentation view model for a combat action.
 * Pure data — no React, no hooks. Consumers apply context (e.g. campaignId for footer links)
 * and render secondLine/name as appropriate for their layout.
 */
export type ActionPresentationViewModel = {
  actionId: string
  displayName: string
  secondLine?: string
  badges: ActionBadgeDescriptor[]
  category: ActionSemanticCategory
  sourceTag: ActionSourceTag
  footerLink?: ActionFooterLink
}
