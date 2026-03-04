import { useState, useEffect } from 'react'
import type { CharacterDoc } from '@/features/character/domain/types'
import type { CampaignSummary, PendingMembership } from '@/shared/types/campaign.types'
import { apiFetch } from '@/app/api'

interface CharacterResponse {
  character: CharacterDoc
  campaigns: CampaignSummary[]
  isOwner: boolean
  isAdmin: boolean
  pendingMemberships?: PendingMembership[]
  ownerName?: string
}

export interface UseCharacterReturn {
  character: CharacterDoc | null
  campaigns: CampaignSummary[]
  isOwner: boolean
  isAdmin: boolean
  ownerName: string | undefined
  pendingMemberships: PendingMembership[]
  loading: boolean
  error: string | null
  success: string | null
  setCharacter: React.Dispatch<React.SetStateAction<CharacterDoc | null>>
  setCampaigns: React.Dispatch<React.SetStateAction<CampaignSummary[]>>
  setPendingMemberships: React.Dispatch<React.SetStateAction<PendingMembership[]>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>
}

export function useCharacter(id: string | undefined): UseCharacterReturn {
  const [character, setCharacter] = useState<CharacterDoc | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ownerName, setOwnerName] = useState<string | undefined>()
  const [pendingMemberships, setPendingMemberships] = useState<PendingMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiFetch<CharacterResponse>(`/api/characters/${id}`)
      .then((data) => {
        setCharacter(data.character)
        setCampaigns(data.campaigns ?? [])
        setIsOwner(data.isOwner)
        setIsAdmin(data.isAdmin)
        setPendingMemberships(data.pendingMemberships ?? [])
        setOwnerName(data.ownerName)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  return {
    character,
    campaigns,
    isOwner,
    isAdmin,
    ownerName,
    pendingMemberships,
    loading,
    error,
    success,
    setCharacter,
    setCampaigns,
    setPendingMemberships,
    setError,
    setSuccess,
  }
}
