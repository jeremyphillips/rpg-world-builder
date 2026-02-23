/**
 * Provides the active campaign's resolved CampaignRulesContext (ruleset + catalog).
 *
 * Must be rendered inside ActiveCampaignProvider.
 * When no campaign is loaded the default ruleset / full system catalog is used.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useActiveCampaign } from './ActiveCampaignProvider'
import {
  resolveCampaignRulesContext,
  type CampaignRulesContext,
} from '@/features/mechanics/domain/core/rules/resolveCampaignRulesContext'

const CampaignRulesCtx = createContext<CampaignRulesContext | undefined>(undefined)

export const CampaignRulesProvider = ({ children }: { children: ReactNode }) => {
  const { campaign } = useActiveCampaign()

  const value = useMemo(
    () => resolveCampaignRulesContext(campaign),
    [campaign],
  )

  return (
    <CampaignRulesCtx.Provider value={value}>
      {children}
    </CampaignRulesCtx.Provider>
  )
}

export const useCampaignRules = (): CampaignRulesContext => {
  const ctx = useContext(CampaignRulesCtx)
  if (!ctx) {
    throw new Error('useCampaignRules must be used within CampaignRulesProvider')
  }
  return ctx
}
