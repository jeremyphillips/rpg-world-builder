import type { CombatStatePresentation } from './presentable-effects.types'

/**
 * Non-`EffectConditionId` combat state keys (engine markers, derived UI, bespoke mechanics).
 * PHB conditions live in `EFFECT_CONDITION_DEFINITIONS` and merge into `COMBAT_STATE_UI_MAP`.
 */
export const COMBAT_STATE_MARKER_UI_MAP: Record<string, CombatStatePresentation> = {
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
  speed_halved: {
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
