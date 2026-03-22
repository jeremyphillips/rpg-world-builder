import {
  EFFECT_CONDITION_DEFINITIONS,
  type EffectConditionId,
} from '@/features/mechanics/domain/conditions/effect-condition-definitions'
import type {
  CombatStatePresentation,
  CombatStateSection,
  PresentableCombatEffect,
} from './presentable-effects.types'
import { COMBAT_STATE_MARKER_UI_MAP } from './combat-state-markers'

export { COMBAT_STATE_MARKER_UI_MAP } from './combat-state-markers'

const SECTION_ORDER: CombatStateSection[] = [
  'critical-now',
  'ongoing-effects',
  'restrictions',
  'turn-triggers',
  'system-details',
]

const PRIORITY_ORDER = ['critical', 'high', 'normal', 'low', 'hidden'] as const

function toTitleCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Presentation rows derived from `EFFECT_CONDITION_DEFINITIONS` (PHB conditions only).
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

/**
 * Header chips: effects in the critical band that are user-facing (matches prior `showInHeader` behavior).
 */
export function shouldShowPresentationInHeader(p: CombatStatePresentation): boolean {
  return p.defaultSection === 'critical-now' && p.userFacing !== false
}

/**
 * Merged lookup: PHB conditions from definitions + bespoke engine markers (see `combat-state-markers.ts`).
 */
export const COMBAT_STATE_UI_MAP: Record<string, CombatStatePresentation> = {
  ...EFFECT_CONDITION_PRESENTATION_MAP,
  ...COMBAT_STATE_MARKER_UI_MAP,
}

export function getCombatStatePresentation(
  key: string,
  map: Record<string, CombatStatePresentation> = COMBAT_STATE_UI_MAP,
): CombatStatePresentation | undefined {
  return map[key]
}

export function getFallbackPresentation(effect: PresentableCombatEffect): CombatStatePresentation {
  return {
    label: toTitleCase(effect.key.replace(/[-_]/g, ' ')),
    tone: effect.isNegative ? 'warning' : 'neutral',
    priority: 'normal',
    defaultSection: 'restrictions',
    userFacing: true,
  }
}

export function getSectionOrder(): readonly CombatStateSection[] {
  return SECTION_ORDER
}

export function getPriorityOrder(): readonly string[] {
  return PRIORITY_ORDER
}
