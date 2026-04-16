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

export type UseViewerCharacterQueryOptions = {
  /**
   * When set, only this viewer character is loaded (must appear in campaign viewer ids).
   * Invalid or missing ids are ignored and all viewer characters are fetched.
   */
  characterId?: string | null
}

export function useViewerCharacterQuery(
  options?: UseViewerCharacterQueryOptions,
): {
  mergedContext: CharacterQueryContext
  contextsById: ReadonlyMap<string, CharacterQueryContext>
  loading: boolean
  ready: boolean
  activeContext: CharacterQueryContext | null
} {
  const { viewerCharacterIds } = useCampaignMembers()
  const characterId = options?.characterId ?? null

  const fetchIds = useMemo(() => {
    if (viewerCharacterIds.length === 0) return []
    if (characterId && viewerCharacterIds.includes(characterId)) {
      return [characterId]
    }
    return [...viewerCharacterIds]
  }, [viewerCharacterIds, characterId])

  const fetchKey = useMemo(() => fetchIds.slice().sort().join(','), [fetchIds])

  const [contextsById, setContextsById] = useState<Map<string, CharacterQueryContext>>(
    () => new Map(),
  )
  const [completedForKey, setCompletedForKey] = useState<string | null>('')

  const ready = completedForKey === fetchKey
  const loading = fetchIds.length > 0 && !ready

  useEffect(() => {
    if (fetchIds.length === 0) {
      setContextsById(new Map())
      setCompletedForKey('')
      return
    }

    setCompletedForKey(null)
    let cancelled = false

    Promise.all(
      fetchIds.map((id) =>
        apiFetch<CharacterResponse>(`/api/characters/${id}`)
          .then((d) => [id, buildCharacterQueryContext(toCharacterForEngine(d.character))] as const)
          .catch(() => [id, createEmptyCharacterQueryContext()] as const),
      ),
    ).then((results) => {
      if (cancelled) return
      setContextsById(new Map(results))
      setCompletedForKey(fetchKey)
    })

    return () => {
      cancelled = true
    }
  }, [fetchKey, fetchIds])

  const mergedContext = useMemo(
    () => mergeCharacterQueryContexts([...contextsById.values()]),
    [contextsById],
  )

  const activeContext = useMemo(() => {
    if (!characterId) return null
    return contextsById.get(characterId) ?? null
  }, [characterId, contextsById])

  return {
    mergedContext,
    contextsById,
    loading,
    ready,
    activeContext,
  }
}
