import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { ZoomControl } from '@/ui/patterns'
import type { ZoomControlProps } from '@/ui/patterns'
import type { CanvasPoint, UseCanvasPanReturn } from '@/ui/hooks'

type LocationEditorCanvasProps = {
  children: ReactNode
  zoom: number
  pan: CanvasPoint
  panHandlers: UseCanvasPanReturn['pointerHandlers']
  isDragging: boolean
  /**
   * Idle cursor on the pan surface. Use `default` in map select mode so gutters / padding
   * do not show the open-hand grab cursor while edge hit-testing still runs.
   */
  panCursor?: 'grab' | 'default'
  /** Callback ref that attaches a non-passive wheel listener for pinch/Ctrl-scroll zoom. */
  wheelContainerRef: (node: HTMLElement | null) => void
  zoomControlProps: ZoomControlProps
}

export function LocationEditorCanvas({
  children,
  zoom,
  pan,
  panHandlers,
  isDragging,
  panCursor = 'grab',
  wheelContainerRef,
  zoomControlProps,
}: LocationEditorCanvasProps) {
  const idlePanCursor = panCursor === 'default' ? 'default' : 'grab'
  return (
    <Box
      ref={wheelContainerRef}
      {...panHandlers}
      sx={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : idlePanCursor,
      }}
    >
      <Box
        sx={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        {children}
      </Box>

      <ZoomControl {...zoomControlProps} />
    </Box>
  )
}
