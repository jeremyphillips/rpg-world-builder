import { useCallback, useMemo, useState } from 'react'

import { useViewerCharacterQuery } from '@/features/campaign/hooks/useViewerCharacterQuery'
import {
  getOwnedIdsForCampaignContentListKey,
  type CampaignContentListOwnershipKey,
} from '@/features/character/domain/query'

import { DM_OWNED_BY_CHARACTER_FILTER_ID } from '@/features/content/shared/domain/dmOwnedByCharacterFilter'

/**
 * DM-only list filter: loads {@link CharacterQueryContext} for the selected party character
 * (via extended {@link useViewerCharacterQuery}) and derives owned ids for the content list key.
 * Disabled when `!canManage` so it does not duplicate the viewer-character query used for PCs.
 * Do not use this hook to full-page-block list routes while the DM query loads — the filter
 * accessor respects `queryReady` so the grid can stay mounted and toolbar badges remain visible.
 */
export function useDmPartyCharacterOwnedQuery(
  canManage: boolean,
  approvedCharacters: { id: string; name: string }[],
  contentListKey: CampaignContentListOwnershipKey,
) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('all')
  const eligiblePartyCharacterIds = useMemo(
    () => approvedCharacters.map((c) => c.id),
    [approvedCharacters],
  )

  const dmQuery = useViewerCharacterQuery({
    enabled: canManage,
    characterId: selectedCharacterId !== 'all' ? selectedCharacterId : null,
    eligiblePartyCharacterIds,
  })

  const ownedIds = useMemo(() => {
    if (!canManage || selectedCharacterId === 'all') {
      return new Set<string>()
    }
    return getOwnedIdsForCampaignContentListKey(dmQuery.mergedContext, contentListKey)
  }, [canManage, selectedCharacterId, dmQuery.mergedContext, contentListKey])

  const onDmOwnedByCharacterFilterChange = useCallback((filterId: string, value: unknown) => {
    if (filterId === DM_OWNED_BY_CHARACTER_FILTER_ID) {
      setSelectedCharacterId(String(value ?? 'all'))
    }
  }, [])

  const dmOwnedByCharacterFilterConfig =
    canManage && approvedCharacters.length > 0
      ? {
          selectedCharacterId,
          ownedIds,
          queryReady: dmQuery.ready,
          partyCharacters: approvedCharacters,
        }
      : undefined

  return {
    selectedCharacterId,
    dmOwnedByCharacterFilterConfig,
    onDmOwnedByCharacterFilterChange,
  }
}
