import Typography from '@mui/material/Typography'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import type { ActionBadgeDescriptor } from '../../../domain/badges/action/combat-action-badges.types'
import { ActionRowBase } from './ActionRowBase'

type NaturalActionRowProps = {
  action: CombatActionDefinition
  badges: ActionBadgeDescriptor[]
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

export function NaturalActionRow({ action, badges, isSelected, isAvailable = true, onSelect }: NaturalActionRowProps) {
  const meta = action.displayMeta?.source === 'natural' ? action.displayMeta : undefined

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
      badges={badges}
    />
  )
}
