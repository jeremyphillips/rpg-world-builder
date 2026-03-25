import type { TurnBoundary } from '@/features/mechanics/domain/effects/timing.types'

export type PresentableCombatEffectKind =
  | 'condition'
  | 'effect'
  | 'trigger'
  | 'modifier'
  | 'suppression'

export type PresentableCombatEffect = {
  id: string
  kind: PresentableCombatEffectKind
  key: string
  label: string
  summary?: string
  duration?: string
  source?: string
  mechanicalImpact?: string[]
  isNegative?: boolean
  isHidden?: boolean
}

export type PresentableTurnHook = PresentableCombatEffect & {
  kind: 'trigger'
  boundary: TurnBoundary
  requirements?: string[]
  suppressed?: boolean
}

export type CombatStatePriority =
  | 'critical'
  | 'high'
  | 'normal'
  | 'low'
  | 'hidden'

export type CombatStateTone =
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'neutral'

export type CombatStateSection =
  | 'critical-now'
  | 'ongoing-effects'
  | 'restrictions'
  | 'turn-triggers'
  | 'system-details'

export type CombatStatePresentation = {
  label: string
  tone: CombatStateTone
  priority: CombatStatePriority
  defaultSection: CombatStateSection
  /** Condensed SRD-style reference for tooltips (conditions from definitions; optional on markers). */
  rulesText?: string
  userFacing?: boolean
  summarize?: (effect: PresentableCombatEffect) => string
}

/** `defense` = damage/condition defense badges (separate derivation from `formatDamageDefenseLabel`). */
export type PresentationTier = 'core' | 'specialized' | 'fallback' | 'defense'

export type EnrichedPresentableEffect = PresentableCombatEffect & {
  presentation: CombatStatePresentation
  /** Where the row was resolved: PHB/core map, specialized map, or generic fallback. */
  presentationTier: PresentationTier
  /** True when `presentation` came from `getFallbackPresentation` (tier `fallback`). */
  usedFallbackPresentation: boolean
}
