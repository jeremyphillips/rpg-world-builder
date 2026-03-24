import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { ActionBadgeDescriptor } from '../../../domain/badges/action/combat-action-badges.types'
import { ActionRowBase } from './ActionRowBase'

type WeaponActionRowProps = {
  action: CombatActionDefinition
  badges: ActionBadgeDescriptor[]
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

export function WeaponActionRow({ action, badges, isSelected, isAvailable = true, onSelect }: WeaponActionRowProps) {
  return (
    <ActionRowBase
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      name={action.label}
      badges={badges}
    />
  )
}
