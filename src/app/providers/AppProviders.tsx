import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../theme'
import { CharacterBuilderProvider } from '@/features/characterBuilder/context/CharacterBuilderProvider'
import { AuthProvider } from './AuthProvider'
import { NotificationProvider } from './NotificationProvider'
import { ActiveCampaignProvider } from './ActiveCampaignProvider'
import { CampaignRulesProvider } from './CampaignRulesProvider'
import { SocketConnectionProvider } from './SocketConnectionProvider'
import { MessagingProvider } from './MessagingProvider'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <SocketConnectionProvider>
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
        </SocketConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
