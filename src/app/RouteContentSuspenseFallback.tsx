import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

/** In-layout fallback while a lazy child route loads (drawer/chrome stays visible). */
export function RouteContentSuspenseFallback() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '35vh',
        opacity: 0.75,
      }}
    >
      <CircularProgress size={28} />
    </Box>
  )
}
