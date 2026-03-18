import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { formatSigned } from '../../helpers'
import { ActionRowBase } from './ActionRowBase'

type WeaponActionRowProps = {
  action: CombatActionDefinition
  isSelected: boolean
  onSelect?: () => void
}

export function WeaponActionRow({ action, isSelected, onSelect }: WeaponActionRowProps) {
  const meta = action.displayMeta?.source === 'weapon' ? action.displayMeta : undefined
  const ap = action.attackProfile

  return (
    <ActionRowBase
      isSelected={isSelected}
      onSelect={onSelect}
      name={action.label}
      badges={
        <>
          {ap && (
            <AppBadge label={`${formatSigned(ap.attackBonus)} to hit`} tone="default" variant="outlined" size="small" />
          )}
          {meta?.range && (
            <AppBadge label={meta.range} tone="default" variant="outlined" size="small" />
          )}
          {ap?.damage && (
            <AppBadge
              label={ap.damageType ? `${ap.damage} ${ap.damageType}` : ap.damage}
              tone="default"
              variant="outlined"
              size="small"
            />
          )}
        </>
      }
    />
  )
}
