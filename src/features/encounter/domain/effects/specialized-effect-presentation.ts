import type { CombatStatePresentation } from './presentable-effects.types'

/**
 * Tier 2 — Specialized / niche presentation: named source-specific, monster-specific, or
 * system-detail markers. Not universal PHB/core combat states; kept separate from
 * core-combat-state-presentation.ts so the core map stays small and stable.
 */
export const SPECIALIZED_EFFECT_PRESENTATION_MAP: Record<string, CombatStatePresentation> = {
  'mummy-rot': {
    label: 'Mummy Rot',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'turn-triggers',
    userFacing: true,
  },
  engulfed: {
    label: 'Engulfed',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'critical-now',
    userFacing: true,
  },
  'limb-severed': {
    label: 'Limb Severed',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'restrictions',
    userFacing: true,
  },
  'battle-focus': {
    label: 'Battle Focus',
    tone: 'info',
    priority: 'normal',
    defaultSection: 'ongoing-effects',
    userFacing: true,
  },
  'speed-halved': {
    label: 'Speed Halved',
    tone: 'warning',
    priority: 'normal',
    defaultSection: 'restrictions',
    userFacing: true,
  },
  on_turn_start_bleed: {
    label: 'Bleed',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'turn-triggers',
    userFacing: true,
    summarize: () => 'Start of turn: take bleed damage',
  },
  suppression_shield_bonus: {
    label: 'Shield Bonus Suppressed',
    tone: 'neutral',
    priority: 'low',
    defaultSection: 'system-details',
    userFacing: false,
  },
}

export const SPECIALIZED_EFFECT_KEYS = Object.freeze(Object.keys(SPECIALIZED_EFFECT_PRESENTATION_MAP))
