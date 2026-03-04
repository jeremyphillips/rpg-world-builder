import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/app/api'
import type { CharacterType } from '@/features/character/domain/types'
import type { CharacterDoc } from '@/features/character/domain/types'

export interface UseCharactersReturn {
  characters: CharacterDoc[]
  loading: boolean
  refetch: () => Promise<void>
}

export function useCharacters(filters?: {
  type?: CharacterType
}) {
  const [characters, setCharacters] = useState<CharacterDoc[]>([])
  const [loading, setLoading] = useState(true)
  const type = filters?.type ?? 'pc'
  const params = new URLSearchParams()

  if (type) params.append("type", type)

  const url = `/api/characters?${params.toString()}`

  const refetch = useCallback(async () => {
    try {
      const data = await apiFetch<{ characters: CharacterDoc[] }>(url)
      setCharacters(data.characters ?? [])
    } catch {
      setCharacters([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { characters, loading, refetch }
}
