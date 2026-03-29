import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

type LocationEditorCanvasProps = {
  children: ReactNode
}

/**
 * Canvas region for the location map editor.
 *
 * `position: relative` establishes the positioning context for future
 * absolute overlays (ZoomControl, tool palettes). `overflow: hidden`
 * contains the transform surface for zoom/pan.
 */
export function LocationEditorCanvas({ children }: LocationEditorCanvasProps) {
  return (
    <Box
      sx={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Box>
  )
}
