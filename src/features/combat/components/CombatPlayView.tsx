import type { ReactNode, Ref } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import {
  ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR,
  ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX,
} from '@/ui/primitives'
import { ZoomControl } from '@/ui/patterns'
import type { ZoomControlProps } from '@/ui/patterns'

/**
 * Shared active encounter shell: header, grid canvas, sidebar, action drawers, toasts.
 * Route containers (Encounter Simulator, GameSession `/play`) supply handlers/state and pass slots here.
 */
export type CombatPlayViewProps = {
  activeHeader: ReactNode
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
  activeHeader,
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

      {gridHoverStatusMessage && (
        <Typography
          variant="caption"
          component="div"
          role="status"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `calc(var(${ENCOUNTER_ACTIVE_HEADER_HEIGHT_CSS_VAR}, ${ENCOUNTER_ACTIVE_HEADER_LAYOUT_HEIGHT_PX}px))`,
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
