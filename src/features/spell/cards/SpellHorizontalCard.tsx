import { HorizontalCompactCard } from '@/ui/patterns'
import type { CardBadgeProps } from '@/ui/primitives'
import type { SpellData } from '@/data/spells'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpellHorizontalCardProps {
  spell: SpellData
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
  const badges: CardBadgeProps[] = [
    { type: 'tag', value: levelLabel(spell.level) },
    { type: 'tag', value: schoolLabel(spell.school) },
  ]

  if (spell.ritual) badges.push({ type: 'tag', value: 'Ritual' })
  if (spell.concentration) badges.push({ type: 'tag', value: 'Concentration' })

  const classNames = spell.classes
    .map(c => c.charAt(0).toUpperCase() + c.slice(1))
    .join(', ')

  return (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        cursor: disabled ? 'default' : onToggle ? 'pointer' : undefined,
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      <HorizontalCompactCard
        headline={spell.name}
        subheadline={classNames}
        badges={badges}
        description={spell.source ? `Source: ${spell.source}` : undefined}
        actions={
          onToggle ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: selected ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-divider)',
                backgroundColor: selected ? 'var(--mui-palette-primary-main)' : 'transparent',
                color: selected ? '#fff' : 'transparent',
                fontSize: 14,
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
            >
              {selected ? '✓' : ''}
            </span>
          ) : undefined
        }
      />
    </div>
  )
}

export default SpellHorizontalCard
