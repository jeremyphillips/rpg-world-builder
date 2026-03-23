import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

type AuthMainFocusProps = {
  children: ReactNode
}

/** Full-bleed main region for encounter / canvas-style views (outlier). */
export function AuthMainFocus({ children }: AuthMainFocusProps) {
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: 0,
        p: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--mui-palette-background-default)',
      }}
    >
      {children}
    </Box>
  )
}
