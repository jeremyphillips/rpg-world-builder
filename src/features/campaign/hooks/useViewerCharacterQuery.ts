/**
 * Fetches each viewer campaign character once, builds a {@link CharacterQueryContext}
 * per character, and merges them for content lists (owned IDs, filters, adornments).
 */
import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/app/api'
import type { CharacterDetailDto } from '@/features/character/read-model'
import {
  buildCharacterQueryContextFromDetailDto,
  createEmptyCharacterQueryContext,
  mergeCharacterQueryContexts,
  type CharacterQueryContext,
} from '@/features/character/domain/query'

import { useCampaignMembers } from './useCampaignMembers'

const EMPTY_CHARACTER_CONTEXT_MAP = new Map<string, CharacterQueryContext>()

type CharacterResponse = { character: CharacterDetailDto }

export type UseViewerCharacterQueryOptions = {
  /**
   * When set, only this character is loaded when it appears in the fetch-eligible set
   * (see {@link eligiblePartyCharacterIds} and campaign viewer character ids).
   * When unset, all viewer campaign characters are fetched (existing PC merged/single behavior).
   */
  characterId?: string | null
  /**
   * Additional character ids eligible for fetch (e.g. approved party PCs for a DM-only list filter).
   * Unioned with viewer character ids for eligibility and single-character fetch mode.
   */
  eligiblePartyCharacterIds?: readonly string[] | null
  /**
   * When false, skips network fetch and exposes empty contexts with `ready: true`.
   * Use to disable a secondary query without duplicating another `useViewerCharacterQuery` instance.
   */
  enabled?: boolean
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
  const eligiblePartyCharacterIds = options?.eligiblePartyCharacterIds ?? null
  const enabled = options?.enabled !== false

  const eligibleIds = useMemo(() => {
    const s = new Set<string>()
    for (const id of viewerCharacterIds) {
      s.add(id)
    }
    if (eligiblePartyCharacterIds) {
      for (const id of eligiblePartyCharacterIds) {
        s.add(id)
      }
    }
    return s
  }, [viewerCharacterIds, eligiblePartyCharacterIds])

  const fetchIds = useMemo(() => {
    if (!enabled) return []
    if (characterId && eligibleIds.has(characterId)) {
      return [characterId]
    }
    if (viewerCharacterIds.length > 0) {
      return [...viewerCharacterIds]
    }
    return []
  }, [enabled, characterId, eligibleIds, viewerCharacterIds])

  const fetchKey = useMemo(() => fetchIds.slice().sort().join(','), [fetchIds])

  const [contextsById, setContextsById] = useState<Map<string, CharacterQueryContext>>(
    () => new Map(),
  )
  const [completedForKey, setCompletedForKey] = useState<string | null>('')

  /** When fetchKey is empty, nothing to wait for — avoid coupling to leftover completedForKey state. */
  const ready =
    fetchKey === '' ||
    completedForKey === fetchKey
  const loading = fetchKey !== '' && fetchIds.length > 0 && !ready

  useEffect(() => {
    if (!fetchKey) return

    const idsForFetch = fetchKey.split(',')

    let cancelled = false

    Promise.all(
      idsForFetch.map((id) =>
        apiFetch<CharacterResponse>(`/api/characters/${id}`)
          .then((d) => [id, buildCharacterQueryContextFromDetailDto(d.character)] as const)
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
  }, [fetchKey])

  const mergedContext = useMemo(() => {
    if (!fetchKey) return mergeCharacterQueryContexts([])
    return mergeCharacterQueryContexts([...contextsById.values()])
  }, [fetchKey, contextsById])

  const contextsByIdReturned = fetchKey === '' ? EMPTY_CHARACTER_CONTEXT_MAP : contextsById

  const activeContext = useMemo(() => {
    if (!characterId || !fetchKey) return null
    return contextsById.get(characterId) ?? null
  }, [characterId, contextsById, fetchKey])

  return {
    mergedContext,
    contextsById: contextsByIdReturned,
    loading,
    ready,
    activeContext,
  }
}
