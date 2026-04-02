import type { ReactNode } from 'react'

import Box from '@mui/material/Box'

export type ActivePlayPageShellProps = {
  /**
   * Optional page-level strip (title, session copy, route actions) above the active play surface.
   * Route containers own what goes here; shared combat content stays in `children`.
   */
  metadata?: ReactNode
  children: ReactNode
}

/**
 * Route-level framing for active play surfaces: fills the auth main focus region (see
 * `isAuthMainFocusPath`), optional metadata strip, and a flex slot for shared combat content
 * (e.g. CombatPlayView via useEncounterActivePlaySurface).
 */
export function ActivePlayPageShell({ metadata, children }: ActivePlayPageShellProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {metadata != null ? (
        <Box sx={{ flexShrink: 0, px: 2, pt: 2, pb: 1 }}>{metadata}</Box>
      ) : null}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </Box>
    </Box>
  )
}
