import { Navigate } from 'react-router-dom'
import { useAcceptInvite } from '@/features/auth/invite'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppAlert } from '@/ui/primitives'
import CircularProgress from '@mui/material/CircularProgress'

export default function AcceptInviteRoute() {
  const { resolution } = useAcceptInvite()

  if (resolution.type === 'loading') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Validating your invite...</Typography>
      </Box>
    )
  }

  if (resolution.type === 'error') {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}>
        <AppAlert tone="danger">
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Invite Error
          </Typography>
          {resolution.message}
        </AppAlert>
      </Box>
    )
  }

  if (resolution.type === 'redirect-login') {
    return <Navigate to={resolution.loginUrl} replace />
  }

  if (resolution.type === 'redirect-register') {
    return <Navigate to={resolution.registerUrl} replace />
  }

  if (resolution.type === 'redirect') {
    return <Navigate to={resolution.to} replace state={resolution.state} />
  }

  return null
}
