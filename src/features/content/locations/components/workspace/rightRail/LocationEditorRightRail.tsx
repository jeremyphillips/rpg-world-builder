import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { locationEditorWorkspaceUiTokens } from '@/features/content/locations/domain/presentation/map/locationEditorWorkspaceUiTokens'

type LocationEditorRightRailProps = {
  children: ReactNode
  open?: boolean
  width?: number
}

export function LocationEditorRightRail({
  children,
  open = true,
  width = locationEditorWorkspaceUiTokens.rightRailWidthPx,
}: LocationEditorRightRailProps) {
  return (
    <Box
      sx={{
        width: open ? width : 0,
        minWidth: 0,
        overflow: 'hidden',
        transition: 'width 200ms ease-in-out',
        borderLeft: open ? 1 : 0,
        borderColor: 'divider',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          width,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          p: 0,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
