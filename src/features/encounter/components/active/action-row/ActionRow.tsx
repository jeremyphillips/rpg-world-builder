import { useParams } from 'react-router-dom'
import Typography from '@mui/material/Typography'

import { ROUTES } from '@/app/routes'
import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter/resolution/combat-action.types'
import { deriveCombatActionBadges } from '../../../domain/badges/action/combat-action-badges'
import { ActionRowBase } from './ActionRowBase'

type ActionRowProps = {
  action: CombatActionDefinition
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
}

function deriveDisplayName(action: CombatActionDefinition): string {
  if (action.displayMeta?.source === 'spell') {
    return `${action.label} \u00B7 Lvl ${action.displayMeta.level}`
  }
  return action.label
}

function deriveSecondLine(action: CombatActionDefinition): React.ReactNode | undefined {
  if (action.displayMeta?.source === 'spell' && action.displayMeta.summary) {
    return <Typography variant="caption" color="text.secondary">{action.displayMeta.summary}</Typography>
  }
  if (action.displayMeta?.source === 'natural' && action.displayMeta.description) {
    return <Typography variant="caption" color="text.secondary">{action.displayMeta.description}</Typography>
  }
  return undefined
}

function useSpellFooterLink(action: CombatActionDefinition): { to: string; label: string } | undefined {
  const { id: campaignId } = useParams<{ id: string }>()
  if (action.displayMeta?.source !== 'spell') return undefined
  const { spellId } = action.displayMeta
  if (!campaignId || !spellId) return undefined
  return {
    to: ROUTES.WORLD_SPELL.replace(':id', campaignId).replace(':spellId', spellId),
    label: 'View details',
  }
}

export function ActionRow({ action, isSelected, isAvailable = true, onSelect }: ActionRowProps) {
  const badges = deriveCombatActionBadges(action)
  const footerLink = useSpellFooterLink(action)

  return (
    <ActionRowBase
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      name={deriveDisplayName(action)}
      secondLine={deriveSecondLine(action)}
      badges={badges}
      footerActionTo={footerLink?.to}
      footerActionLabel={footerLink?.label}
      footerActionOpenInNewTab={footerLink != null ? true : undefined}
    />
  )
}
