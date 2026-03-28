import type { MarkerRule } from './condition-consequences.types'
import { CONDITION_RULES } from './condition-definitions'
import { ENGINE_STATE_RULES } from './engine-state-definitions'

/** Unified lookup for core SRD conditions and custom engine markers (IDs must not collide). */
export const ALL_MARKER_RULES: Record<string, MarkerRule> = {
  ...CONDITION_RULES,
  ...ENGINE_STATE_RULES,
}
