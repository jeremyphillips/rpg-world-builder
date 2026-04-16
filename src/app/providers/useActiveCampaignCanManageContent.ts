import { canManageContent, toViewerContext } from '@/shared/domain/capabilities'

import { useActiveCampaign } from './ActiveCampaignProvider'

export function useActiveCampaignCanManageContent(): boolean {
  const { campaign } = useActiveCampaign()
  return canManageContent(toViewerContext(campaign?.viewer))
}
