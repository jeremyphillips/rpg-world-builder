import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { LOCATION_EDITOR_HEADER_HEIGHT_PX, LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX } from './locationEditor.constants'

type LocationEditorRightRailProps = {
  children: ReactNode
  open?: boolean
  width?: number
}

export function LocationEditorRightRail({
  children,
  open = true,
  width = LOCATION_EDITOR_RIGHT_RAIL_WIDTH_PX,
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
      }}
    >
      <Box
        sx={{
          width,
          height: (theme) =>
            `calc(100vh - ${LOCATION_EDITOR_HEADER_HEIGHT_PX}px - ${theme.spacing(4)})`,
          overflowY: 'auto',
          p: 2.5,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
