import { useMemo } from 'react'

import type { ViewerContext } from '@/shared/domain/capabilities'
import { toViewerContext } from '@/shared/domain/capabilities'

import { useActiveCampaign } from './ActiveCampaignProvider'
import { useActiveCampaignViewerCharacterIds } from './useActiveCampaignViewerCharacterIds'

export function useActiveCampaignViewerContext(): ViewerContext | undefined {
  const { campaign } = useActiveCampaign()
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds()

  return useMemo(
    () => toViewerContext(campaign?.viewer, viewerCharacterIds),
    [campaign?.viewer, viewerCharacterIds],
  )
}
