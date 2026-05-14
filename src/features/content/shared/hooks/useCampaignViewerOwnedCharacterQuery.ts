import { useMemo } from 'react'

import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers'
import { useViewerCharacterQuery } from '@/features/campaign/hooks/useViewerCharacterQuery'
import { useViewerOwnedCharacterQueryPreference } from '@/app/providers/useViewerOwnedCharacterQueryPreference'

/**
 * Campaign content lists: viewer ownership query + persisted scope (merged vs one PC) when the user
 * controls multiple characters in the campaign.
 */
export function useCampaignViewerOwnedCharacterQuery(
  campaignId: string | null,
  viewerCharacterIds: string[],
) {
  const preference = useViewerOwnedCharacterQueryPreference(campaignId, viewerCharacterIds)
  const query = useViewerCharacterQuery(
    preference.characterIdForQuery ? { characterId: preference.characterIdForQuery } : undefined,
  )

  const { approvedCharacters } = useCampaignMembers()

  const ownershipScopeOptions = useMemo(() => {
    if (viewerCharacterIds.length <= 1) return []
    const nameById = new Map(approvedCharacters.map((c) => [c.id, c.name]))
    return viewerCharacterIds.map((id) => ({
      id,
      label: nameById.get(id) ?? 'Character',
    }))
  }, [approvedCharacters, viewerCharacterIds])

  return {
    ...query,
    ...preference,
    ownershipScopeOptions,
  }
}
