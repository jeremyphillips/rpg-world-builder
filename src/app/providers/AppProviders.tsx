import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../theme'
import { AuthProvider } from './AuthProvider'
import { NotificationProvider } from './NotificationProvider'
import { ActiveCampaignProvider } from './ActiveCampaignProvider'

interface AppProvidersProps {
  children: ReactNode
}

/** Global shell: theme, auth, active campaign id, notifications. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ActiveCampaignProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </ActiveCampaignProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
