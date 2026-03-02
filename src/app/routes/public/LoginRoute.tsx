import { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import {
  AppForm,
  DynamicFormRenderer,
  FormActions,
  type FieldConfig,
} from '@/ui/patterns'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { AppAlert } from '@/ui/primitives'

type LoginFormData = {
  email: string
  password: string
}

const fields: FieldConfig[] = [
  {
    type: 'text',
    name: 'email',
    label: 'Email',
    inputType: 'email',
    required: true,
    placeholder: 'you@example.com',
  },
  {
    type: 'text',
    name: 'password',
    label: 'Password',
    inputType: 'password',
    required: true,
    placeholder: 'Enter your password',
  },
]

const defaultValues: LoginFormData = { email: '', password: '' }

export default function LoginRoute() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const [error, setError] = useState('')

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (user) {
    return <Navigate to={redirectTo ?? ROUTES.DASHBOARD} replace />
  }

  async function handleSubmit(data: LoginFormData) {
    setError('')
    try {
      await signIn(data.email, data.password)
      navigate(redirectTo ?? ROUTES.DASHBOARD, { replace: true })
    } catch {
      setError('Invalid email or password.')
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Sign In
      </Typography>

      {error && <AppAlert tone="danger" sx={{ mb: 2 }}>{error}</AppAlert>}

      <AppForm<LoginFormData> defaultValues={defaultValues} onSubmit={handleSubmit}>
        <DynamicFormRenderer fields={fields} />
        <FormActions submitLabel="Sign In" />
      </AppForm>
    </Box>
  )
}
