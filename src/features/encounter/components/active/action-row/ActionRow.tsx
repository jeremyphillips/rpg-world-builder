import Typography from '@mui/material/Typography'

import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { deriveCombatActionBadges } from '../../../domain/badges/action/combat-action-badges'
import { ActionRowBase } from './ActionRowBase'
import { WeaponActionRow } from './WeaponActionRow'
import { SpellActionRow } from './SpellActionRow'
import { NaturalActionRow } from './NaturalActionRow'
import type { ActionBadgeDescriptor } from '../../../domain/badges/action/combat-action-badges.types'

type ActionRowProps = {
  action: CombatActionDefinition
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

function GenericActionRow({ action, badges, isSelected, isAvailable = true, onSelect }: ActionRowProps & { badges: ActionBadgeDescriptor[] }) {
  return (
    <ActionRowBase
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      name={action.label}
      secondLine={
        action.displayMeta?.source === 'natural' && action.displayMeta.description ? (
          <Typography variant="caption" color="text.secondary">{action.displayMeta.description}</Typography>
        ) : undefined
      }
      badges={badges}
    />
  )
}

export function ActionRow({ action, isSelected, isAvailable = true, onSelect }: ActionRowProps) {
  const badges = deriveCombatActionBadges(action)

  switch (action.kind) {
    case 'weapon-attack':
      return <WeaponActionRow action={action} badges={badges} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
    case 'spell':
      return <SpellActionRow action={action} badges={badges} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
    case 'monster-action':
      return <NaturalActionRow action={action} badges={badges} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
    default:
      return <GenericActionRow action={action} badges={badges} isSelected={isSelected} isAvailable={isAvailable} onSelect={onSelect} />
  }
}
