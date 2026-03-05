/**
 * Provides the set of skill proficiency IDs owned by the current viewer's
 * characters in the active campaign. Used by SkillProficiencyListRoute
 * for makeOwnedColumn / makeOwnedFilter.
 */
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/app/api'
import { useCampaignMembers } from './useCampaignMembers'
import type { CharacterProficiencies } from '@/features/character/domain/types'

type CharacterProficienciesResponse = {
  character: {
    _id: string
    proficiencies?: CharacterProficiencies
  }
}

export function useViewerProficiencies(): {
  skills: ReadonlySet<string>
  loading: boolean
} {
  const { viewerCharacterIds } = useCampaignMembers()
  const [profsList, setProfsList] = useState<string[][]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewerCharacterIds.length === 0) {
      setProfsList([])
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all(
      viewerCharacterIds.map((id) =>
        apiFetch<CharacterProficienciesResponse>(`/api/characters/${id}`)
          .then((d) => d.character.proficiencies?.skills ?? [])
          .catch(() => [] as string[])
      )
    )
      .then((results) => {
        if (!cancelled) setProfsList(results)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewerCharacterIds])

  return useMemo(() => {
    const skills = new Set<string>()
    for (const arr of profsList) {
      for (const id of arr) skills.add(id)
    }
    return { skills, loading }
  }, [profsList, loading])
}
