import { useSearchParams, Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { ROUTES } from '@/app/routes'
import { RegisterForm, useRegister } from '@/features/auth/register'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { AppAlert } from '@/ui/primitives'

export default function RegisterRoute() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('inviteToken') ?? ''
  const { register, error, redirectAfterAuth } = useRegister()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (user) {
    return (
      <Navigate
        to={redirectAfterAuth?.to ?? ROUTES.DASHBOARD}
        replace
        state={redirectAfterAuth?.state}
      />
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 440, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Create Account
      </Typography>

      {inviteToken && (
        <AppAlert tone="info" sx={{ mb: 2 }}>
          You've been invited to join a campaign! Create an account to get started.
        </AppAlert>
      )}

      {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

      <RegisterForm inviteToken={inviteToken} onSubmit={register} />
    </Box>
  )
}
