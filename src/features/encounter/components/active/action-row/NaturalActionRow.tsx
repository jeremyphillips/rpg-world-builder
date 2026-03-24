import Typography from '@mui/material/Typography'

import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { formatSigned } from '../../../helpers'
import { ActionRowBase } from './ActionRowBase'

type NaturalActionRowProps = {
  action: CombatActionDefinition
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

export function NaturalActionRow({ action, isSelected, isAvailable = true, onSelect }: NaturalActionRowProps) {
  const meta = action.displayMeta?.source === 'natural' ? action.displayMeta : undefined
  const ap = action.attackProfile
  const damage = ap?.damage ?? action.damage
  const damageType = ap?.damageType ?? action.damageType

  return (
    <ActionRowBase
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      name={action.label}
      secondLine={
        meta?.description ? (
          <Typography variant="caption" color="text.secondary">
            {meta.description}
          </Typography>
        ) : undefined
      }
      badges={
        <>
          {damage && (
            <AppBadge label={damage} tone="default" variant="outlined" size="small" />
          )}
          {meta?.attackType && damageType && (
            <AppBadge label={`${meta.attackType} ${damageType}`} tone="default" variant="outlined" size="small" />
          )}
          {!meta?.attackType && damageType && (
            <AppBadge label={damageType} tone="default" variant="outlined" size="small" />
          )}
          {ap && (
            <AppBadge label={`To hit: ${formatSigned(ap.attackBonus)}`} tone="default" variant="outlined" size="small" />
          )}
          {meta?.reach != null && (
            <AppBadge label={`${meta.reach}ft`} tone="default" variant="outlined" size="small" />
          )}
          {action.sequence?.map((step) => (
            <AppBadge
              key={step.actionLabel}
              label={`Sequence: ${step.actionLabel} x ${step.count}`}
              tone="default"
              variant="outlined"
              size="small"
            />
          ))}
        </>
      }
    />
  )
}
