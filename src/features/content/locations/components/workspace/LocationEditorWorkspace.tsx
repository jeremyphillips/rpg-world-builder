import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { locationEditorWorkspaceUiTokens } from '@/features/content/locations/domain/presentation/map/locationEditorWorkspaceUiTokens'

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
        height: `calc(100vh - ${locationEditorWorkspaceUiTokens.headerHeightPx}px)`,
      }}
    >
      {header}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          minHeight: `calc(100vh - ${locationEditorWorkspaceUiTokens.headerHeightPx}px)`,
        }}
      >
        {canvas}
        {rightRail}
      </Box>
    </Box>
  )
}
