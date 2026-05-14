import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_PREFIX = 'viewerOwnedCharacterScope:v1:'

function storageKey(campaignId: string) {
  return `${STORAGE_PREFIX}${campaignId}`
}

export function readViewerOwnedCharacterScopePreference(campaignId: string | null): string | null {
  if (!campaignId || typeof window === 'undefined') return null
  return localStorage.getItem(storageKey(campaignId))
}

function writeViewerOwnedCharacterScopePreference(campaignId: string | null, value: 'merge' | string) {
  if (!campaignId || typeof window === 'undefined') return
  localStorage.setItem(storageKey(campaignId), value)
}

/**
 * Persists whether campaign content "owned" UI uses a merged viewer union or a single viewer PC.
 * Only applies when the user has more than one viewer character in the campaign.
 */
export function useViewerOwnedCharacterQueryPreference(
  campaignId: string | null,
  viewerCharacterIds: string[],
): {
  /** Pass to `useViewerCharacterQuery`: `undefined` = merged fetch; a string = that PC only. */
  characterIdForQuery: string | undefined
  /** Current scope for UI: merged, or a specific character id (including when there is only one PC). */
  ownershipScope: 'merged' | string
  setOwnershipScope: (next: 'merged' | string) => void
  showOwnershipScopePicker: boolean
} {
  const [stored, setStored] = useState<string | null>(() =>
    readViewerOwnedCharacterScopePreference(campaignId),
  )

  useEffect(() => {
    setStored(readViewerOwnedCharacterScopePreference(campaignId))
  }, [campaignId])

  const characterIdForQuery = useMemo((): string | undefined => {
    if (viewerCharacterIds.length === 0) return undefined
    if (viewerCharacterIds.length === 1) return viewerCharacterIds[0]
    if (stored === null) return undefined
    if (stored === 'merge') return undefined
    if (viewerCharacterIds.includes(stored)) return stored
    return undefined
  }, [viewerCharacterIds, stored])

  const ownershipScope = useMemo((): 'merged' | string => {
    if (viewerCharacterIds.length === 0) return 'merged'
    if (viewerCharacterIds.length === 1) return viewerCharacterIds[0]!
    return characterIdForQuery === undefined ? 'merged' : characterIdForQuery
  }, [viewerCharacterIds, characterIdForQuery])

  const setOwnershipScope = useCallback(
    (next: 'merged' | string) => {
      if (!campaignId) return
      if (viewerCharacterIds.length <= 1) return
      const raw = next === 'merged' ? 'merge' : next
      writeViewerOwnedCharacterScopePreference(campaignId, raw)
      setStored(raw)
    },
    [campaignId, viewerCharacterIds.length],
  )

  useEffect(() => {
    if (viewerCharacterIds.length <= 1) return
    if (stored === null) return
    if (stored !== 'merge' && !viewerCharacterIds.includes(stored)) {
      writeViewerOwnedCharacterScopePreference(campaignId, 'merge')
      setStored('merge')
    }
  }, [campaignId, viewerCharacterIds, stored])

  const showOwnershipScopePicker = viewerCharacterIds.length > 1

  return {
    characterIdForQuery,
    ownershipScope,
    setOwnershipScope,
    showOwnershipScopePicker,
  }
}
