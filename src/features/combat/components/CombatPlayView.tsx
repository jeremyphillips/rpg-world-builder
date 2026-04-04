import type { ReactNode, Ref } from 'react'
import { useLayoutEffect, useRef } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { ZoomControl } from '@/ui/patterns'
import type { ZoomControlProps } from '@/ui/patterns'

/** Publishes measured strip height so grid hover status clears the contextual strip (see layout below). */
const ENCOUNTER_CONTEXT_STRIP_HEIGHT_CSS_VAR = '--encounter-context-strip-height'

function EncounterContextStripMeasure({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const sync = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty(ENCOUNTER_CONTEXT_STRIP_HEIGHT_CSS_VAR, `${h}px`)
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty(ENCOUNTER_CONTEXT_STRIP_HEIGHT_CSS_VAR)
    }
  }, [children])
  return (
    <Box ref={ref} sx={{ flexShrink: 0 }}>
      {children}
    </Box>
  )
}

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
  /**
   * Under-header contextual strip (turn/movement guidance, stairs, future portals) — not the action deck.
   */
  contextualStrip?: ReactNode
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
  contextualStrip,
  gridHoverStatusMessage,
  gameOverModal,
  toast,
  wheelContainerRef,
  zoomControlProps,
  encounterGrid,
  encounterActiveSidebar,
  actionDrawer,
}: CombatPlayViewProps) {
  const gridHoverTop = `calc(var(${activeHeaderOffsetCssVar}, ${activeHeaderOffsetFallbackPx}px) + var(${ENCOUNTER_CONTEXT_STRIP_HEIGHT_CSS_VAR}, 0px))`

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {activeHeader}

      {contextualStrip != null ? (
        <EncounterContextStripMeasure>{contextualStrip}</EncounterContextStripMeasure>
      ) : null}

      {gridHoverStatusMessage && (
        <Typography
          variant="caption"
          component="div"
          role="status"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: gridHoverTop,
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
