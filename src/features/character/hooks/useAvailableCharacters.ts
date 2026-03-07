import { useState, useEffect } from 'react'
import { apiFetch } from '@/app/api'
import type { CharacterCardSummary } from '@/features/character/read-model'

export interface UseAvailableCharactersReturn {
  availableCharacters: CharacterCardSummary[]
  loading: boolean
}

export function useAvailableCharacters(enabled: boolean): UseAvailableCharactersReturn {
  const [availableCharacters, setAvailableCharacters] = useState<CharacterCardSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    apiFetch<{ characters: CharacterCardSummary[] }>('/api/characters/available-for-campaign')
      .then((data) => setAvailableCharacters(data.characters ?? []))
      .catch(() => setAvailableCharacters([]))
      .finally(() => setLoading(false))
  }, [enabled])

  return { availableCharacters, loading }
}
