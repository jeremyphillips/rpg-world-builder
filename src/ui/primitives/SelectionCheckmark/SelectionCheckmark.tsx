import Box from '@mui/material/Box'

export interface SelectionCheckmarkProps {
  selected: boolean
  /** Non-interactive / unavailable row: keeps layout with muted styling. */
  disabled?: boolean
}

/**
 * Circular selection indicator (empty ring vs filled + check) for compact horizontal cards.
 */
export function SelectionCheckmark({ selected, disabled = false }: SelectionCheckmarkProps) {
  return (
    <Box
      aria-hidden
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : disabled ? 'text.disabled' : 'divider',
        bgcolor: selected ? 'primary.main' : 'transparent',
        color: selected ? 'primary.contrastText' : 'transparent',
        fontSize: 14,
        fontWeight: 700,
        transition: 'all 0.15s ease',
        flexShrink: 0,
        opacity: disabled ? 0.85 : 1,
      }}
    >
      {selected ? '✓' : ''}
    </Box>
  )
}
