import type { ReactNode } from 'react'
import { CharacterBuilderProvider } from '@/features/characterBuilder/context/CharacterBuilderProvider'
import { CampaignRulesProvider } from './CampaignRulesProvider'

/** Campaign rules + character builder — for character routes and public home (not global). */
export function CharacterProviders({ children }: { children: ReactNode }) {
  return (
    <CampaignRulesProvider>
      <CharacterBuilderProvider>{children}</CharacterBuilderProvider>
    </CampaignRulesProvider>
  )
}
