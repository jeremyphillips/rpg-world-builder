import {
  CONDITION_IMMUNITY_ONLY_DEFINITIONS,
  EFFECT_CONDITION_DEFINITIONS,
  type EffectConditionId,
} from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type { CombatStatePresentation } from './presentable-effects.types'

/**
 * Tier 1 — Core encounter presentation: PHB conditions, immunity-only condition ids
 * (e.g. exhaustion), and universal engine markers (bloodied, concentrating, banished).
 * Not source-specific named afflictions — those live in specialized-effect-presentation.ts.
 */

function effectConditionDefinitionRowToPresentation(
  row: (typeof EFFECT_CONDITION_DEFINITIONS)[number],
): CombatStatePresentation {
  return {
    label: row.name,
    tone: row.tone,
    priority: row.priority,
    defaultSection: row.defaultSection,
    userFacing: row.userFacing ?? true,
    ...(row.rulesText ? { rulesText: row.rulesText } : {}),
  }
}

export const EFFECT_CONDITION_PRESENTATION_MAP = Object.fromEntries(
  EFFECT_CONDITION_DEFINITIONS.map((row) => [
    row.id,
    effectConditionDefinitionRowToPresentation(row),
  ]),
) as Record<EffectConditionId, CombatStatePresentation>

/** Condition ids that appear in immunity grants but are not PHB effect conditions (see mechanics domain). */
export const CONDITION_IMMUNITY_ONLY_PRESENTATION_MAP: Record<string, CombatStatePresentation> =
  Object.fromEntries(
    CONDITION_IMMUNITY_ONLY_DEFINITIONS.map((row) => [
      row.id,
      {
        label: row.name,
        tone: 'warning' as const,
        priority: 'normal' as const,
        defaultSection: 'restrictions' as const,
        userFacing: true,
      },
    ]),
  )

/** Engine-wide markers that are not PHB conditions but behave like core combat states. */
export const CORE_ENGINE_MARKER_PRESENTATION_MAP: Record<string, CombatStatePresentation> = {
  banished: {
    label: 'Banished',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
  },
  bloodied: {
    label: 'Bloodied',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
  },
  concentrating: {
    label: 'Concentrating',
    tone: 'info',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
  },
  /** Encounter participation — not a PHB condition; preview chips + headers. */
  participation_defeated: {
    label: 'Defeated',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    userFacing: true,
  },
}

export const CORE_COMBAT_STATE_MAP: Record<string, CombatStatePresentation> = {
  ...EFFECT_CONDITION_PRESENTATION_MAP,
  ...CONDITION_IMMUNITY_ONLY_PRESENTATION_MAP,
  ...CORE_ENGINE_MARKER_PRESENTATION_MAP,
}

export const CORE_COMBAT_STATE_KEYS = Object.freeze(Object.keys(CORE_COMBAT_STATE_MAP))
