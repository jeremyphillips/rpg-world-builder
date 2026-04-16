/**
 * Fetches each viewer campaign character once, builds a {@link CharacterQueryContext}
 * per character, and merges them for content lists (owned IDs, filters, adornments).
 */
import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/app/api'
import type { CharacterDetailDto } from '@/features/character/read-model'
import { toCharacterForEngine } from '@/features/character/read-model'
import {
  buildCharacterQueryContext,
  createEmptyCharacterQueryContext,
  mergeCharacterQueryContexts,
  type CharacterQueryContext,
} from '@/features/character/domain/query'

import { useCampaignMembers } from './useCampaignMembers'

type CharacterResponse = { character: CharacterDetailDto }

export function useViewerCharacterQuery(): {
  context: CharacterQueryContext
  loading: boolean
} {
  const { viewerCharacterIds } = useCampaignMembers()
  const [built, setBuilt] = useState<CharacterQueryContext[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewerCharacterIds.length === 0) {
      setBuilt([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      viewerCharacterIds.map((id) =>
        apiFetch<CharacterResponse>(`/api/characters/${id}`)
          .then((d) => buildCharacterQueryContext(toCharacterForEngine(d.character)))
          .catch(() => createEmptyCharacterQueryContext()),
      ),
    )
      .then((results) => {
        if (!cancelled) setBuilt(results)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewerCharacterIds])

  const context = useMemo(() => mergeCharacterQueryContexts(built), [built])

  return { context, loading }
}
