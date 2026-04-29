import { canManageContent } from '@/shared/domain/capabilities'

import { useActiveCampaignViewerContext } from './useActiveCampaignViewerContext'

export function useActiveCampaignCanManageContent(): boolean {
  const viewerContext = useActiveCampaignViewerContext()
  return viewerContext ? canManageContent(viewerContext) : false
}
