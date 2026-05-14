import { useCallback, useId, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppPopover, AppSlider } from '@/ui/primitives'
import type { MuiDenseInputSize } from '@/ui/sizes'

import {
  indexRangeToValues,
  valuesToIndexRange,
  type NumericRange,
} from '../filters/discreteNumericRange'

export type AppToolbarDiscreteRangeFieldProps = {
  label: string
  steps: readonly number[]
  value: NumericRange
  onChange: (next: NumericRange) => void
  formatValue: (n: number) => string
  /** Applied to the field control (not the whole toolbar row). */
  'aria-label'?: string
  size?: MuiDenseInputSize
}

/**
 * Compact toolbar control: button opens a popover with a discrete range slider.
 */
export default function AppToolbarDiscreteRangeField({
  label,
  steps,
  value,
  onChange,
  formatValue,
  'aria-label': ariaLabel,
  size = 'small',
}: AppToolbarDiscreteRangeFieldProps) {
  const labelId = useId()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const [iMin, iMax] = valuesToIndexRange(steps, value.min, value.max)

  const handleClose = useCallback(() => setAnchorEl(null), [])

  const summary =
    steps.length === 0 ? '—' : `${formatValue(value.min)}\u2013${formatValue(value.max)}`

  const handleSliderChange = useCallback(
    (_e: Event, newValue: number | number[]) => {
      const arr = Array.isArray(newValue) ? newValue : [newValue, newValue]
      const [a, b] = arr.length >= 2 ? [arr[0]!, arr[1]!] : [arr[0]!, arr[0]!]
      onChange(indexRangeToValues(steps, a, b))
    },
    [onChange, steps],
  )

  const maxIndex = Math.max(0, steps.length - 1)

  if (steps.length === 0) {
    return (
      <Button size={size} variant="outlined" disabled sx={{ minWidth: 120 }}>
        {label}: —
      </Button>
    )
  }

  return (
    <>
      <Button
        size={size}
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-labelledby={labelId}
        aria-label={ariaLabel ?? label}
        sx={{ minWidth: 120, flex: '0 1 auto' }}
      >
        <Box component="span" id={labelId} sx={{ fontWeight: 600 }}>
          {label}
        </Box>
        : {summary}
      </Button>
      <AppPopover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: { px: 2, py: 2, minWidth: 280 },
          },
        }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle2" fontWeight={600}>
            {label}
          </Typography>
          <AppSlider
            value={[iMin, iMax]}
            onChange={handleSliderChange}
            min={0}
            max={maxIndex}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(index) => formatValue(steps[Math.round(index)] ?? 0)}
            getAriaValueText={(index) => formatValue(steps[Math.round(index)] ?? 0)}
            disableSwap
          />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {formatValue(value.min)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatValue(value.max)}
            </Typography>
          </Stack>
        </Stack>
      </AppPopover>
    </>
  )
}
