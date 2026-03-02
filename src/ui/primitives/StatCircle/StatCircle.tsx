import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export interface StatCircleProps {
  label: string
  value?: number | null
}

export default function StatCircle({ label, value = null }: StatCircleProps) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: '3px solid var(--mui-palette-primary-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 0.5,
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          {value ?? '—'}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}
      >
        {label}
      </Typography>
    </Box>
  )
}
