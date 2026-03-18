import Box from '@mui/material/Box'

type EncounterViewProps = {
  mode: 'setup' | 'active'
  setupHeader: React.ReactNode
  activeHeader?: React.ReactNode
  activeFooter?: React.ReactNode
  children: React.ReactNode
}

export function EncounterView({
  mode,
  setupHeader,
  activeHeader,
  activeFooter,
  children,
}: EncounterViewProps) {
  const header = mode === 'setup' ? setupHeader : activeHeader
  const footer = mode === 'active' ? activeFooter : null

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 104px)',
        mx: -4,
        mt: -3,
        mb: -4,
        overflow: 'hidden',
      }}
    >
      {header && (
        <Box sx={{ flexShrink: 0 }}>
          {header}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', px: 4, py: 3 }}>
        {children}
      </Box>

      {footer && (
        <Box sx={{ flexShrink: 0 }}>
          {footer}
        </Box>
      )}
    </Box>
  )
}
