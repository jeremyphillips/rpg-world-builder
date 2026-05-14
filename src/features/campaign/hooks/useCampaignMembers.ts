import { useMemo } from 'react'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { useActiveCampaignViewerCharacterIds } from '@/app/providers/useActiveCampaignViewerCharacterIds'

const EMPTY_MEMBERS: CampaignMemberView[] = []
import type { CampaignMemberView, CampaignMembersPayload } from '@/shared/types/campaign.types'

export interface CampaignMembersResult {
  members: CampaignMemberView[]
  viewerCharacterIds: readonly string[]
  counts: CampaignMembersPayload['counts'] | null
  /** Approved characters as { id, name } — convenience for policy / visibility pickers. */
  approvedCharacters: { id: string; name: string }[]
  loading: boolean
}

/**
 * Sources campaign member data from `campaign.members` (populated by
 * GET /api/campaigns/:id).  No additional API call required.
 */
export function useCampaignMembers(): CampaignMembersResult {
  const { campaign, loading } = useActiveCampaign()
  const viewerCharacterIds = useActiveCampaignViewerCharacterIds()

  const members = campaign?.members?.items ?? EMPTY_MEMBERS
  const counts = campaign?.members?.counts ?? null

  const approvedCharacters = useMemo(
    () =>
      members
        .filter((m) => m.status === 'approved')
        .map((m) => ({ id: m.character.id, name: m.character.name })),
    [members],
  )

  return { members, viewerCharacterIds, counts, approvedCharacters, loading }
}
