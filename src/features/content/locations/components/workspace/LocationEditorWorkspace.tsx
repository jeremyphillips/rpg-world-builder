import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

type LocationEditorWorkspaceProps = {
  header: ReactNode
  canvas: ReactNode
  rightRail: ReactNode
}

export function LocationEditorWorkspace({
  header,
  canvas,
  rightRail,
}: LocationEditorWorkspaceProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {header}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {canvas}
        {rightRail}
      </Box>
    </Box>
  )
}
