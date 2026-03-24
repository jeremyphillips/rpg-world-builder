import { useParams } from 'react-router-dom'
import Typography from '@mui/material/Typography'

import { ROUTES } from '@/app/routes'
import { AppBadge } from '@/ui/primitives'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { ActionRowBase } from './ActionRowBase'

type SpellActionRowProps = {
  action: CombatActionDefinition
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

export function SpellActionRow({ action, isSelected, isAvailable = true, onSelect }: SpellActionRowProps) {
  const { id: campaignId } = useParams<{ id: string }>()
  const meta = action.displayMeta?.source === 'spell' ? action.displayMeta : undefined

  const nameLabel = meta != null
    ? `${action.label} \u00B7 Lvl ${meta.level}`
    : action.label

  const footerActionTo =
    campaignId && meta?.spellId
      ? ROUTES.WORLD_SPELL.replace(':id', campaignId).replace(':spellId', meta.spellId)
      : undefined

  return (
    <ActionRowBase
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      name={nameLabel}
      footerActionTo={footerActionTo}
      footerActionLabel="View details"
      footerActionOpenInNewTab
      secondLine={
        meta?.summary ? (
          <Typography variant="caption" color="text.secondary">
            {meta.summary}
          </Typography>
        ) : undefined
      }
      badges={
        <>
          <AppBadge label={action.resolutionMode} tone="default" variant="outlined" size="small" />
          {action.saveProfile && (
            <AppBadge
              label={`${action.saveProfile.ability.toUpperCase()} DC ${action.saveProfile.dc}`}
              tone="default"
              variant="outlined"
              size="small"
            />
          )}
          {meta?.range && (
            <AppBadge label={meta.range} tone="default" variant="outlined" size="small" />
          )}
          {meta?.concentration && (
            <AppBadge label="concentration" tone="default" variant="outlined" size="small" />
          )}
        </>
      }
    />
  )
}
