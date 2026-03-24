import type { SxProps, Theme } from '@mui/material/styles'

/** Shared horizontal padding and min height for encounter top chrome (header strip + action toast). */
export const encounterActiveBarSx: SxProps<Theme> = {
  px: 4,
  py: 2,
  minHeight: 88,
}
