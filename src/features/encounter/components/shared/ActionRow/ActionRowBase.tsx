import { HorizontalCompactActionCard } from '@/ui/patterns'

export type ActionRowBaseProps = {
  isSelected: boolean
  isAvailable?: boolean
  onSelect?: () => void
  name: React.ReactNode
  secondLine?: React.ReactNode
  badges: React.ReactNode
  footerActionTo?: string
  footerActionLabel?: string
  footerActionOpenInNewTab?: boolean
}

export function ActionRowBase({
  isSelected,
  isAvailable = true,
  onSelect,
  name,
  secondLine,
  badges,
  footerActionTo,
  footerActionLabel,
  footerActionOpenInNewTab,
}: ActionRowBaseProps) {
  return (
    <HorizontalCompactActionCard
      isSelected={isSelected}
      isAvailable={isAvailable}
      onSelect={onSelect}
      headline={name}
      titleVariant="body2"
      subheadline={secondLine}
      titleBadges={badges}
      footerActionTo={footerActionTo}
      footerActionLabel={footerActionLabel}
      footerActionOpenInNewTab={footerActionOpenInNewTab}
    />
  )
}
