import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { ROUTES } from '@/app/routes'
import { HorizontalCompactActionCard, HorizontalCompactCard } from '@/ui/patterns'
import { CardBadge } from '@/ui/primitives'
import type { CardBadgeProps } from '@/ui/primitives'
import type { Spell } from '@/features/content/spells/domain/types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpellHorizontalCardProps {
  spell: Spell
  selected?: boolean
  disabled?: boolean
  onToggle?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function schoolLabel(school: string): string {
  return school.charAt(0).toUpperCase() + school.slice(1)
}

function levelLabel(level: number): string {
  if (level === 0) return 'Cantrip'
  return `Level ${level}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SpellHorizontalCard = ({
  spell,
  selected = false,
  disabled = false,
  onToggle,
}: SpellHorizontalCardProps) => {
  const { campaignId } = useActiveCampaign()

  const spellDetailPath =
    campaignId != null
      ? ROUTES.WORLD_SPELL.replace(':id', campaignId).replace(':spellId', spell.id)
      : undefined

  const badgeItems: CardBadgeProps[] = [
    { type: 'tag', value: levelLabel(spell.level) },
    { type: 'tag', value: schoolLabel(spell.school) },
  ]

  const titleBadges = (
    <>
      {badgeItems.map((b, i) => (
        <CardBadge key={i} type={b.type} value={b.value} />
      ))}
    </>
  )

  const subheadline = (
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {spell.description.summary}
    </Typography>
  )

  const shared = {
    headline: `${spell.name} \u00B7 Lvl ${spell.level}`,
    subheadline,
    titleBadges,
    footerActionTo: spellDetailPath,
    footerActionLabel: 'View details',
    footerActionOpenInNewTab: true,
  }

  if (onToggle != null) {
    return (
      <Box sx={{ opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s ease' }}>
        <HorizontalCompactActionCard
          {...shared}
          isSelected={selected}
          isAvailable={!disabled}
          onSelect={disabled ? undefined : onToggle}
          alwaysShowCheckmark
        />
      </Box>
    )
  }

  return (
    <Box sx={{ opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s ease' }}>
      <HorizontalCompactCard {...shared} />
    </Box>
  )
}

export default SpellHorizontalCard
