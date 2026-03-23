import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { formatSigned } from '../../../helpers'
import { ActionRowBase } from './ActionRowBase'
import { WeaponActionRow } from './WeaponActionRow'
import { SpellActionRow } from './SpellActionRow'
import { NaturalActionRow } from './NaturalActionRow'

type ActionRowProps = {
  action: CombatActionDefinition
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

function GenericActionRow({ action, isSelected, isAvailable = true, onSelect }: ActionRowProps) {
  const ap = action.attackProfile
  const detailParts: string[] = []

  if (ap) {
    detailParts.push(`${formatSigned(ap.attackBonus)} to hit`)
    if (ap.damage) {
      detailParts.push(ap.damageType ? `${ap.damage} ${ap.damageType}` : ap.damage)
    }
  } else if (action.saveProfile) {
    detailParts.push(`DC ${action.saveProfile.dc} ${action.saveProfile.ability.toUpperCase()} save`)
  }
  if (action.damage && !ap) {
    detailParts.push(action.damageType ? `${action.damage} ${action.damageType}` : action.damage)
  }

  const usageLabel = action.usage?.recharge
    ? `Recharge ${action.usage.recharge.min}\u2013${action.usage.recharge.max}`
    : null

  return (
    <ActionRowBase
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      name={action.label}
      secondLine={
        detailParts.length > 0 ? (
          <Typography variant="caption" color="text.secondary">{detailParts.join(' \u00B7 ')}</Typography>
        ) : undefined
      }
      badges={
        usageLabel ? (
          <AppBadge label={usageLabel} tone="default" variant="outlined" size="small" />
        ) : null
      }
    />
  )
}

export function ActionRow({ action, isSelected, isAvailable = true, onSelect }: ActionRowProps) {
  switch (action.kind) {
    case 'weapon-attack':
      return <WeaponActionRow action={action} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
    case 'spell':
      return <SpellActionRow action={action} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
    case 'monster-action':
      return <NaturalActionRow action={action} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
    default:
      return <GenericActionRow action={action} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
  }
}
