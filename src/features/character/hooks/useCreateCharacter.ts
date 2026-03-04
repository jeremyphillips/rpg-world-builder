import { useState, useCallback } from 'react'
import type { CharacterDoc } from '@/features/character/domain/types'
import { apiFetch } from '@/app/api'

export interface UseCreateCharacterReturn {
  createCharacter: (data: Record<string, unknown>) => Promise<CharacterDoc>
  creating: boolean
}

export function useCreateCharacter(): UseCreateCharacterReturn {
  const [creating, setCreating] = useState(false)

  const createCharacter = useCallback(async (data: Record<string, unknown>) => {
    setCreating(true)
    try {
      const res = await apiFetch<{ character: CharacterDoc }>('/api/characters', {
        method: 'POST',
        body: data,
      })
      return res.character
    } finally {
      setCreating(false)
    }
  }, [])

  return { createCharacter, creating }
}
