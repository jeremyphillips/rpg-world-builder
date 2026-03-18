import type { AbilityId, AbilityKey } from '../character'

// ---------------------------------------------------------------------------
// Stat target
// ---------------------------------------------------------------------------

export type AbilityScoreTarget = `ability_score.${AbilityId}`

export type StatTarget =
  | AbilityKey // @deprecated('Use AbilityId instead')
  | AbilityId
  | AbilityScoreTarget
  | 'armor_class'
  | 'attack_roll'
  | 'damage'
  | 'speed'
  | 'initiative'
  | 'saving_throw'
  | 'spell_save_dc'
  | 'hit_points'
  | 'hit_points_temporary'
  | 'hit_points_max'
  | 'hit_points_temporary_max'
  | 'spell_attack'
  | 'resistance'

// ---------------------------------------------------------------------------
// Breakdown types
// ---------------------------------------------------------------------------

export type BreakdownToken = {
  label: string
  value: string
  type: 'proficiency' | 'ability' | 'dice' | 'modifier' | 'damage_type' | 'formula'
}

export type StatResult = {
  value: number
  breakdown: BreakdownToken[]
}
