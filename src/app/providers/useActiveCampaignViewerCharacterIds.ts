import { useMemo } from 'react'

import { useActiveCampaign } from './ActiveCampaignProvider'

const EMPTY_VIEWER_CHARACTER_IDS: readonly string[] = []

/**
 * Viewer character ids from the active campaign membership payload.
 *
 * Returns a stable array reference across `/api/campaigns/:id` refetches when the id list
 * content is unchanged (new array identity).
 */
export function useActiveCampaignViewerCharacterIds(): readonly string[] {
  const { campaign } = useActiveCampaign()
  const raw = campaign?.members?.viewerCharacterIds ?? EMPTY_VIEWER_CHARACTER_IDS

  /** Sorted so order-only churn from the server does not change the fingerprint. */
  const fingerprint = [...raw].slice().sort().join('|')

  return useMemo(() => {
    if (!fingerprint.length) return EMPTY_VIEWER_CHARACTER_IDS
    /** Rebuild from fingerprint so deps are content-based, not raw array identity. */
    return fingerprint.split('|')
  }, [fingerprint])
}
