import type { ReactNode, Ref } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { ZoomControl } from '@/ui/patterns'
import type { ZoomControlProps } from '@/ui/patterns'

/**
 * Shared active play shell: header, grid canvas, sidebar, action drawers, toasts.
 * Hosts supply layout offsets (e.g. from encounter header height) so this module stays free of encounter imports.
 */
export type CombatPlayViewProps = {
  /** CSS custom property name for the sticky header strip height (used to position grid hover status). */
  activeHeaderOffsetCssVar: string
  /** Pixel fallback when the CSS variable is unset. */
  activeHeaderOffsetFallbackPx: number
  activeHeader: ReactNode
  /** Movement-adjacent affordances (e.g. stair traversal), not standard combat actions. */
  contextualMovementBar?: ReactNode
  gridHoverStatusMessage: string | null
  gameOverModal: ReactNode
  toast: ReactNode
  wheelContainerRef: Ref<HTMLDivElement | null>
  zoomControlProps: ZoomControlProps
  encounterGrid: ReactNode
  encounterActiveSidebar: ReactNode
  actionDrawer: ReactNode
}

export function CombatPlayView({
  activeHeaderOffsetCssVar,
  activeHeaderOffsetFallbackPx,
  activeHeader,
  contextualMovementBar,
  gridHoverStatusMessage,
  gameOverModal,
  toast,
  wheelContainerRef,
  zoomControlProps,
  encounterGrid,
  encounterActiveSidebar,
  actionDrawer,
}: CombatPlayViewProps) {
  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {activeHeader}

      {contextualMovementBar}

      {gridHoverStatusMessage && (
        <Typography
          variant="caption"
          component="div"
          role="status"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `calc(var(${activeHeaderOffsetCssVar}, ${activeHeaderOffsetFallbackPx}px))`,
            zIndex: (theme) => theme.zIndex.appBar,
            px: 2,
            py: 0.5,
            minHeight: 26,
            textAlign: 'center',
            color: 'text.secondary',
            fontWeight: 600,
            pointerEvents: 'none',
            textShadow: (theme) => `0 1px 0 ${theme.palette.background.paper}`,
          }}
        >
          {gridHoverStatusMessage}
        </Typography>
      )}

      {gameOverModal}

      {toast}

      <Box ref={wheelContainerRef} sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {encounterGrid}

        <ZoomControl {...zoomControlProps} />

        {encounterActiveSidebar}
      </Box>

      {actionDrawer}
    </Box>
  )
}
