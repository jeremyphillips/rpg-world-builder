import type { SxProps, Theme } from '@mui/material/styles'

/**
 * Fallback (px) before {@link ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR} is set, and for `maxHeight` math.
 */
export const ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX = 104

/**
 * Set on `document.documentElement` by {@link EncounterActiveHeader} (ResizeObserver) so fixed UI
 * (e.g. sidebar) can align to the real header height when content grows past `minHeight`.
 */
export const ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR = '--encounter-active-header-height'

/** Shared horizontal padding and min height for encounter top chrome (header strip + action toast). */
export const encounterActiveBarSx: SxProps<Theme> = {
  px: 4,
  py: 2,
  minHeight: ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX,
  boxSizing: 'border-box',
}
