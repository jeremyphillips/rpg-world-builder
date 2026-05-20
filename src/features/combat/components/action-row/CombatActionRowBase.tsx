import { AppBadge } from '@/ui/primitives'
import { HorizontalCompactActionCard } from '@/ui/patterns/cards/HorizontalCompactActionCard'
import type { ActionBadgeDescriptor } from '@/features/mechanics/domain/combat/presentation/badges/action/combat-action-badges.types'

import { combatToneToAppBadgeTone } from '../cards/combatant-badges'

export type CombatActionRowBaseProps = {
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
  name: React.ReactNode
  secondLine?: React.ReactNode
  badges: ActionBadgeDescriptor[]
  footerActionTo?: string
  footerActionLabel?: string
  footerActionOpenInNewTab?: boolean
}

export function CombatActionRowBase({
  isSelected,
  isAvailable = true,
  onSelect,
  name,
  secondLine,
  badges,
  footerActionTo,
  footerActionLabel,
  footerActionOpenInNewTab,
}: CombatActionRowBaseProps) {
  return (
    <HorizontalCompactActionCard
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      headline={name}
      titleVariant="body2"
      subheadline={secondLine}
      titleBadges={
        badges.length > 0
          ? badges.map((b) => (
              <AppBadge
                key={`${b.kind}-${b.label}`}
                label={b.label}
                tone={combatToneToAppBadgeTone(b.tone)}
                variant="outlined"
                size="small"
              />
            ))
          : undefined
      }
      footerActionTo={footerActionTo}
      footerActionLabel={footerActionLabel}
      footerActionOpenInNewTab={footerActionOpenInNewTab}
    />
  )
}
