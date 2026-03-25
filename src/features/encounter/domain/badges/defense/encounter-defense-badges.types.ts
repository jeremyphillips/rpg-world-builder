import type { ConditionImmunityId } from '@/features/mechanics/domain/conditions/effect-condition-definitions'

/**
 * Encounter-only view model: condition immunity badges (damage defenses are separate).
 * Intrinsic unconditional rows use conditional: false. Active-effect grants use conditional: true.
 */
export type EncounterConditionImmunityBadge = {
  kind: 'condition-immunity'
  condition: ConditionImmunityId
  /** Presentational text (`Immune:` + condition display name from condition definitions). */
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
  /**
   * Canonical presentational text for badges (from `formatDamageDefenseLabel` in encounter-defense-badges).
   * Not copied from `DamageResistanceMarker.label`.
   */
  label: string
  sourceLabel?: string
  conditional: boolean
}

export type EncounterDefenseBadges = {
  condition: EncounterConditionImmunityBadge[]
  damage: EncounterDamageDefenseBadge[]
}
