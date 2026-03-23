import Box from '@mui/material/Box'

import { SelectionCheckmark } from '@/ui/primitives'

import {
  COMPACT_ACTION_DISABLED_OPACITY,
  COMPACT_ACTION_OPACITY_TRANSITION,
  COMPACT_ACTION_UNAVAILABLE_OPACITY,
} from './horizontalCompactCard.constants'
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
 *
 * `disabled` and unavailable (`isAvailable: false`) dimming use shared constants in
 * `horizontalCompactCard.constants.ts`. The checkmark column stays mounted when `onSelect` is provided;
 * interaction is suppressed when unavailable/disabled while keeping consistent layout.
 */
export function HorizontalCompactActionCard({
  isSelected = false,
  isAvailable = true,
  onSelect,
  alwaysShowCheckmark = false,
  disabled = false,
  ...cardProps
}: HorizontalCompactActionCardProps) {
  const showCheckmarkColumn = alwaysShowCheckmark || onSelect != null

  const rowOpacity = disabled
    ? COMPACT_ACTION_DISABLED_OPACITY
    : isAvailable
      ? 1
      : COMPACT_ACTION_UNAVAILABLE_OPACITY

  const canInteract = !disabled && isAvailable

  const card = (
    <HorizontalCompactCard
      {...cardProps}
      disabled={showCheckmarkColumn ? false : disabled}
      selected={isSelected}
      cardSx={{
        cursor: canInteract && onSelect ? 'pointer' : undefined,
        '&:hover': canInteract && onSelect ? { bgcolor: 'action.hover' } : undefined,
        ...cardProps.cardSx,
      }}
    />
  )

  if (!showCheckmarkColumn) {
    return card
  }

  const checkmarkDisabled = disabled || !isAvailable

  return (
    <Box
      onClick={canInteract && onSelect ? onSelect : undefined}
      role={canInteract && onSelect ? 'button' : undefined}
      tabIndex={canInteract && onSelect ? 0 : undefined}
      onKeyDown={
        canInteract && onSelect
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
        opacity: rowOpacity,
        transition: rowOpacity < 1 ? COMPACT_ACTION_OPACITY_TRANSITION : undefined,
        cursor:
          disabled || !isAvailable
            ? 'not-allowed'
            : onSelect
              ? 'pointer'
              : 'default',
        outline: 'none',
      }}
    >
      <Box sx={{ pt: 1.25, flexShrink: 0 }}>
        <SelectionCheckmark selected={isSelected} disabled={checkmarkDisabled} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{card}</Box>
    </Box>
  )
}
