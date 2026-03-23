import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

type AuthMainChromeProps = {
  children: ReactNode
}

/** Default authenticated content area: padded, scrollable. */
export function AuthMainChrome({ children }: AuthMainChromeProps) {
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        p: 4,
        pt: 3,
        overflow: 'auto',
        bgcolor: 'var(--mui-palette-background-default)',
      }}
    >
      {children}
    </Box>
  )
}
