import type { UIMatch } from 'react-router'

/** How {@link AuthLayout} constrains routed content horizontally at the shell. */
export type LayoutWidthMode = 'contained' | 'full'

/**
 * Arbitrary route metadata (React Router `handle`).
 * Only the **leaf** (deepest) match’s `layoutWidth` is used — parents do not impose width on children.
 * When the leaf omits `layoutWidth`, AuthLayout uses `contained`.
 */
export type AppRouteHandle = {
  layoutWidth?: LayoutWidthMode
}

export function layoutWidthModeFromMatches(matches: ReadonlyArray<UIMatch>): LayoutWidthMode {
  if (matches.length === 0) return 'contained'
  const h = matches[matches.length - 1].handle as AppRouteHandle | undefined
  if (h?.layoutWidth === 'full' || h?.layoutWidth === 'contained') {
    return h.layoutWidth
  }
  return 'contained'
}
