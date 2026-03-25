import type {
  CombatStatePresentation,
  CombatStateSection,
  PresentationTier,
  PresentableCombatEffect,
} from './presentable-effects.types'
import { CORE_COMBAT_STATE_MAP } from './core-combat-state-presentation'
import { SPECIALIZED_EFFECT_PRESENTATION_MAP } from './specialized-effect-presentation'

export { COMBAT_STATE_MARKER_UI_MAP } from './combat-state-markers'
export {
  CONDITION_IMMUNITY_ONLY_PRESENTATION_MAP,
  CORE_COMBAT_STATE_KEYS,
  CORE_COMBAT_STATE_MAP,
  CORE_ENGINE_MARKER_PRESENTATION_MAP,
  EFFECT_CONDITION_PRESENTATION_MAP,
} from './core-combat-state-presentation'
export {
  SPECIALIZED_EFFECT_KEYS,
  SPECIALIZED_EFFECT_PRESENTATION_MAP,
} from './specialized-effect-presentation'

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

export type { PresentationTier }

/**
 * Header chips: effects in the critical band that are user-facing (matches prior `showInHeader` behavior).
 */
export function shouldShowPresentationInHeader(p: CombatStatePresentation): boolean {
  return p.defaultSection === 'critical-now' && p.userFacing !== false
}

/**
 * Full merged map for backward-compatible lookup (core ∪ specialized).
 * Resolution order for new code: use `resolveEffectPresentation`.
 */
export const COMBAT_STATE_UI_MAP: Record<string, CombatStatePresentation> = {
  ...CORE_COMBAT_STATE_MAP,
  ...SPECIALIZED_EFFECT_PRESENTATION_MAP,
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

/**
 * Resolve presentation with tier: core PHB/universal → specialized named → title-case fallback.
 */
export function resolveEffectPresentation(effect: PresentableCombatEffect): {
  presentation: CombatStatePresentation
  presentationTier: PresentationTier
  usedFallbackPresentation: boolean
} {
  const key = effect.key
  const core = CORE_COMBAT_STATE_MAP[key]
  if (core) {
    return { presentation: core, presentationTier: 'core', usedFallbackPresentation: false }
  }
  const spec = SPECIALIZED_EFFECT_PRESENTATION_MAP[key]
  if (spec) {
    return { presentation: spec, presentationTier: 'specialized', usedFallbackPresentation: false }
  }
  const presentation = getFallbackPresentation(effect)
  return { presentation, presentationTier: 'fallback', usedFallbackPresentation: true }
}

/**
 * Resolve presentation for a semantic key (condition id, marker map key, etc.).
 * Prefer `marker.id` / `effect.key` — do not pass raw free-form `marker.label` unless no id exists.
 */
export function resolvePresentationForSemanticKey(
  key: string,
  options?: { rawLabel?: string; isNegative?: boolean },
): CombatStatePresentation {
  const synthetic: PresentableCombatEffect = {
    id: '',
    kind: 'effect',
    key,
    label: options?.rawLabel ?? key,
    isNegative: options?.isNegative,
  }
  return resolveEffectPresentation(synthetic).presentation
}

export function getSectionOrder(): readonly CombatStateSection[] {
  return SECTION_ORDER
}

export function getPriorityOrder(): readonly string[] {
  return PRIORITY_ORDER
}
