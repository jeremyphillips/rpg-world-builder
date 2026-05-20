import type { ReactNode } from 'react'
import { CharacterProviders } from './CharacterProviders'
import { MessagingProvider } from './MessagingProvider'
import { SocketConnectionProvider } from './SocketConnectionProvider'

/** Socket, messaging, rules, and builder — mounted under `/campaigns/:id` only. */
export function CampaignProviders({ children }: { children: ReactNode }) {
  return (
    <SocketConnectionProvider>
      <CharacterProviders>
        <MessagingProvider>{children}</MessagingProvider>
      </CharacterProviders>
    </SocketConnectionProvider>
  )
}
