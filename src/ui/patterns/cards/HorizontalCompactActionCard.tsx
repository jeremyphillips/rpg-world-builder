import Box from '@mui/material/Box'

import { SelectionCheckmark } from '@/ui/primitives'

import HorizontalCompactCard, { type HorizontalCompactCardProps } from './HorizontalCompactCard'

export type HorizontalCompactActionCardProps = Omit<HorizontalCompactCardProps, 'selected'> & {
  isSelected?: boolean
  isAvailable?: boolean
  onSelect?: () => void
  /** Show selection checkmark column even when `onSelect` is omitted (e.g. disabled spell row). */
  alwaysShowCheckmark?: boolean
}

/**
 * Horizontal compact card with optional top-left selection checkmark and primary border when selected.
 * Row selection is handled by the outer wrapper `onClick`; footer links call `stopPropagation` internally.
 */
export function HorizontalCompactActionCard({
  isSelected = false,
  isAvailable = true,
  onSelect,
  alwaysShowCheckmark = false,
  ...cardProps
}: HorizontalCompactActionCardProps) {
  const showCheckmarkColumn = alwaysShowCheckmark || onSelect != null

  const card = (
    <HorizontalCompactCard
      {...cardProps}
      selected={isSelected}
      cardSx={{
        cursor: onSelect ? 'pointer' : undefined,
        '&:hover': onSelect ? { bgcolor: 'action.hover' } : undefined,
        ...cardProps.cardSx,
      }}
    />
  )

  if (!showCheckmarkColumn) {
    return card
  }

  return (
    <Box
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect()
              }
            }
          : undefined
      }
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 0.75,
        opacity: isAvailable ? 1 : 0.5,
        cursor: onSelect ? 'pointer' : 'default',
        outline: 'none',
      }}
    >
      <Box sx={{ pt: 1.25, flexShrink: 0 }}>
        <SelectionCheckmark selected={isSelected} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{card}</Box>
    </Box>
  )
}
