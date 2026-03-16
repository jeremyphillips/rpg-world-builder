import type {
  CombatStatePresentation,
  CombatStateSection,
  CombatStateTone,
  PresentableCombatEffect,
} from './presentable-effects.types'

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

export const COMBAT_STATE_UI_MAP: Record<string, CombatStatePresentation> = {
  // Conditions (EffectConditionId)
  blinded: {
    label: 'Blinded',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  charmed: {
    label: 'Charmed',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  deafened: {
    label: 'Deafened',
    tone: 'warning',
    priority: 'normal',
    defaultSection: 'restrictions',
    showAsChip: true,
    userFacing: true,
  },
  frightened: {
    label: 'Frightened',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  grappled: {
    label: 'Grappled',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  incapacitated: {
    label: 'Incapacitated',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  invisible: {
    label: 'Invisible',
    tone: 'info',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  paralyzed: {
    label: 'Paralyzed',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  petrified: {
    label: 'Petrified',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  poisoned: {
    label: 'Poisoned',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  prone: {
    label: 'Prone',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  restrained: {
    label: 'Restrained',
    tone: 'warning',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  stunned: {
    label: 'Stunned',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  unconscious: {
    label: 'Unconscious',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },

  // States
  bloodied: {
    label: 'Bloodied',
    tone: 'danger',
    priority: 'critical',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  concentrating: {
    label: 'Concentrating',
    tone: 'info',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  'mummy-rot': {
    label: 'Mummy Rot',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'turn-triggers',
    showAsChip: true,
    userFacing: true,
  },
  engulfed: {
    label: 'Engulfed',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'critical-now',
    showAsChip: true,
    showInHeader: true,
    userFacing: true,
  },
  'limb-severed': {
    label: 'Limb Severed',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'restrictions',
    showAsChip: true,
    userFacing: true,
  },
  'battle-focus': {
    label: 'Battle Focus',
    tone: 'info',
    priority: 'normal',
    defaultSection: 'ongoing-effects',
    showAsChip: true,
    userFacing: true,
  },
  'speed_halved': {
    label: 'Speed Halved',
    tone: 'warning',
    priority: 'normal',
    defaultSection: 'restrictions',
    userFacing: true,
  },
  'on_turn_start_bleed': {
    label: 'Bleed',
    tone: 'danger',
    priority: 'high',
    defaultSection: 'turn-triggers',
    userFacing: true,
    summarize: () => 'Start of turn: take bleed damage',
  },
  'suppression_shield_bonus': {
    label: 'Shield Bonus Suppressed',
    tone: 'neutral',
    priority: 'low',
    defaultSection: 'system-details',
    userFacing: false,
  },
}

export function getFallbackPresentation(effect: PresentableCombatEffect): CombatStatePresentation {
  return {
    label: toTitleCase(effect.key.replace(/[-_]/g, ' ')),
    tone: effect.isNegative ? 'warning' : 'neutral',
    priority: 'normal',
    defaultSection: 'restrictions',
    showAsChip: true,
    userFacing: true,
  }
}

export function getSectionOrder(): readonly CombatStateSection[] {
  return SECTION_ORDER
}

export function getPriorityOrder(): readonly string[] {
  return PRIORITY_ORDER
}
