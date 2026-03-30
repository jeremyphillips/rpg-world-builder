import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { LOCATION_EDITOR_HEADER_HEIGHT_PX } from './locationEditor.constants'

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
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: `calc(100vh - ${LOCATION_EDITOR_HEADER_HEIGHT_PX}px)`,
      }}
    >
      {header}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: '100%',
        }}
      >
        {canvas}
        {rightRail}
      </Box>
    </Box>
  )
}
