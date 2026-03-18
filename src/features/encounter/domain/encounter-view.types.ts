export type CombatantPreviewMode = 'setup' | 'active'
export type CombatantPreviewKind = 'character' | 'monster'

export type PreviewTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success'

export type PreviewChip = {
  id: string
  label: string
  tone?: PreviewTone
}

export type PreviewStat = {
  label: string
  value: string
}

export type CombatantPreviewAction = {
  id: string
  label: string
  disabled?: boolean
  onClick?: () => void
}

export type CombatantPreviewCardProps = {
  id: string
  kind: CombatantPreviewKind
  mode: CombatantPreviewMode
  title: string
  subtitle?: string
  stats: PreviewStat[]
  chips?: PreviewChip[]
  isCurrentTurn?: boolean
  isSelected?: boolean
  isDefeated?: boolean
  primaryAction?: CombatantPreviewAction
  secondaryActions?: CombatantPreviewAction[]
  onClick?: () => void
}

export type CharacterCombatant = {
  id: string
  name: string
  race?: string
  className?: string
  level?: number
  armorClass?: number
  hitPoints?: { current: number; max: number }
  initiativeModifier?: number
  movement?: { current?: number; max?: number }
  criticalStates?: Array<{ id: string; label: string; tone?: PreviewTone }>
}

export type MonsterCombatant = {
  id: string
  name: string
  creatureType?: string
  challengeRating?: string
  armorClass?: number
  hitPoints?: { current: number; max: number }
  initiativeModifier?: number
  movement?: { current?: number; max?: number }
  criticalStates?: Array<{ id: string; label: string; tone?: PreviewTone }>
}

export type SetupPreviewWrapperProps<TCombatant> = {
  combatant: TCombatant
  isSelected?: boolean
  onClick?: () => void
  onRemove?: () => void
}

export type ActivePreviewWrapperProps<TCombatant> = {
  combatant: TCombatant
  isCurrentTurn?: boolean
  isSelected?: boolean
  onClick?: () => void
  onInspect?: () => void
}

export type TurnOrderStatus =
  | 'current'
  | 'next'
  | 'upcoming'
  | 'acted'
  | 'delayed'
  | 'defeated'
