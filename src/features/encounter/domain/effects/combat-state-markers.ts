import type { CombatStatePresentation } from './presentable-effects.types'
import { CORE_ENGINE_MARKER_PRESENTATION_MAP } from './core-combat-state-presentation'
import { SPECIALIZED_EFFECT_PRESENTATION_MAP } from './specialized-effect-presentation'

/**
 * Legacy merged export: core engine markers + specialized niche markers.
 * Prefer importing `CORE_ENGINE_MARKER_PRESENTATION_MAP` or `SPECIALIZED_EFFECT_PRESENTATION_MAP`
 * when tier matters; use `COMBAT_STATE_UI_MAP` for full resolution order (core → specialized → fallback).
 */
export const COMBAT_STATE_MARKER_UI_MAP: Record<string, CombatStatePresentation> = {
  ...CORE_ENGINE_MARKER_PRESENTATION_MAP,
  ...SPECIALIZED_EFFECT_PRESENTATION_MAP,
}
