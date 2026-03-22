import type { ConditionImmunityId } from '@/features/mechanics/domain/conditions/effect-condition-definitions'

/**
 * Encounter-only view model: condition immunity badges (damage defenses are separate).
 * Intrinsic unconditional rows use conditional: false. Active-effect grants use conditional: true.
 */
export type EncounterConditionImmunityBadge = {
  kind: 'condition-immunity'
  condition: ConditionImmunityId
  label: string
  scopeLabel?: string
  sourceLabel?: string
  conditional: boolean
}

export type EncounterDamageDefenseBadge = {
  kind: 'damage-immunity' | 'damage-resistance' | 'damage-vulnerability'
  /** Stable id from `DamageResistanceMarker.id` (unique per marker row). */
  markerId: string
  damageType: string
  label: string
  sourceLabel?: string
  conditional: boolean
}

export type EncounterDefenseBadges = {
  condition: EncounterConditionImmunityBadge[]
  damage: EncounterDamageDefenseBadge[]
}
