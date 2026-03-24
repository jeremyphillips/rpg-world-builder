import type { CombatStateTone } from '../../effects/presentable-effects.types'

export type ActionBadgeKind =
  | 'to-hit'
  | 'damage'
  | 'damage-type'
  | 'range'
  | 'save-dc'
  | 'concentration'
  | 'recharge'
  | 'uses'
  | 'sequence'

export type ActionBadgeDescriptor = {
  kind: ActionBadgeKind
  label: string
  priority: number
  tone: CombatStateTone
  tooltip?: string
}
