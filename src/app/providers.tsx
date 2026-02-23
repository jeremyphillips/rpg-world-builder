import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import { CharacterBuilderProvider } from '@/features/characterBuilder/context/CharacterBuilderProvider'
import { AuthProvider } from './providers/AuthProvider'
import { NotificationProvider } from './providers/NotificationProvider'
import { ActiveCampaignProvider } from './providers/ActiveCampaignProvider'
import { CampaignRulesProvider } from './providers/CampaignRulesProvider'
import { MessagingProvider } from './providers/MessagingProvider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ActiveCampaignProvider>
          <CampaignRulesProvider>
          <MessagingProvider>
          <NotificationProvider>
            <CharacterBuilderProvider>
              {children}
            </CharacterBuilderProvider>
          </NotificationProvider>
          </MessagingProvider>
          </CampaignRulesProvider>
        </ActiveCampaignProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
