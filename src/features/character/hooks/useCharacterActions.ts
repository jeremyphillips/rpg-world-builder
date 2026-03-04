import { useState, useCallback } from 'react'
import type { CharacterDoc } from '@/features/character/domain/types'
import type { LevelUpResult } from '@/features/character/levelUp'
import { getXpForLevel } from '@/features/mechanics/domain/core/progression/xp'
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider'
import { apiFetch } from '@/app/api'
import type { CampaignSummary, PendingMembership } from '@/shared/types/campaign.types'
import { resolveXpTable } from '@/features/mechanics/domain/core/rules/xp/resolveXpTable'

export interface CharacterActionDeps {
  character: CharacterDoc | null
  setCharacter: React.Dispatch<React.SetStateAction<CharacterDoc | null>>
  setCampaigns: React.Dispatch<React.SetStateAction<CampaignSummary[]>>
  setPendingMemberships: React.Dispatch<React.SetStateAction<PendingMembership[]>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>
  syncFromCharacter: (c: CharacterDoc) => void
}

export interface UseCharacterActionsReturn {
  approvingId: string | null
  saveCharacter: (partial: Record<string, unknown>) => Promise<void>
  handleApprove: (campaignMemberId: string) => Promise<void>
  handleReject: (campaignMemberId: string) => Promise<void>
  handleAwardXp: (params: { newXp: number; triggersLevelUp: boolean; pendingLevel?: number }) => Promise<void>
  handleCancelLevelUp: (currentLevel: number) => Promise<void>
  handleLevelUpComplete: (result: LevelUpResult) => Promise<void>
  handleCharacterStatusChange: (statusAction: {
    campaignMemberId: string
    campaignName: string
    newStatus: 'inactive' | 'deceased'
  }) => Promise<void>
  handleReactivate: (campaignMemberId: string, campaignName: string) => Promise<void>
  handleDeleteCharacter: () => Promise<void>
}

export function useCharacterActions(
  id: string | undefined,
  deps: CharacterActionDeps,
): UseCharacterActionsReturn {
  const {
    character, setCharacter, setCampaigns, setPendingMemberships,
    setError, setSuccess, syncFromCharacter,
  } = deps

  const { ruleset } = useCampaignRules()
  const xpTable = resolveXpTable(ruleset.mechanics.progression.xp);

  const isNpc = character?.type === 'npc'
  const notify = (msg: string) => { if (!isNpc) setSuccess(msg) }

  const [approvingId, setApprovingId] = useState<string | null>(null)

  const saveCharacter = useCallback(async (partial: Record<string, unknown>) => {
    if (!id) return
    setError(null)
    setSuccess(null)
    try {
      const data = await apiFetch<{ character: CharacterDoc }>(`/api/characters/${id}`, {
        method: 'PATCH',
        body: partial,
      })
      setCharacter(data.character)
      syncFromCharacter(data.character)
      notify('Saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      throw err
    }
  }, [id, setCharacter, syncFromCharacter, setError, setSuccess])

  const handleApprove = useCallback(async (campaignMemberId: string) => {
    setApprovingId(campaignMemberId)
    setError(null)
    try {
      await apiFetch(`/api/campaign-members/${campaignMemberId}/approve`, { method: 'POST' })
      setPendingMemberships((prev) => prev.filter((m) => m.campaignMemberId !== campaignMemberId))
      notify('Character approved for campaign')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setApprovingId(null)
    }
  }, [setPendingMemberships, setError, setSuccess])

  const handleReject = useCallback(async (campaignMemberId: string) => {
    setApprovingId(campaignMemberId)
    setError(null)
    try {
      await apiFetch(`/api/campaign-members/${campaignMemberId}/reject`, { method: 'POST' })
      setPendingMemberships((prev) => prev.filter((m) => m.campaignMemberId !== campaignMemberId))
      notify('Character rejected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setApprovingId(null)
    }
  }, [setPendingMemberships, setError, setSuccess])

  const handleAwardXp = useCallback(async (params: {
    newXp: number
    triggersLevelUp: boolean
    pendingLevel?: number
  }) => {
    if (!id) return
    const body: Record<string, unknown> = { xp: params.newXp }
    if (params.triggersLevelUp && params.pendingLevel) {
      body.levelUpPending = true
      body.pendingLevel = params.pendingLevel
    }
    const data = await apiFetch<{ character: CharacterDoc }>(`/api/characters/${id}`, {
      method: 'PATCH',
      body,
    })
    setCharacter(data.character)
    syncFromCharacter(data.character)
  }, [id, setCharacter, syncFromCharacter])

  const handleCancelLevelUp = useCallback(async (
    currentLevel: number,
  ) => {
    if (!id || !character) return
    const revertedXp = getXpForLevel(currentLevel, xpTable)
    const data = await apiFetch<{ character: CharacterDoc }>(`/api/characters/${id}`, {
      method: 'PATCH',
      body: {
        xp: revertedXp,
        levelUpPending: false,
        pendingLevel: null,
      },
    })
    setCharacter(data.character)
    syncFromCharacter(data.character)
    notify('Level-up cancelled. XP has been reverted.')
  }, [id, character, xpTable, setCharacter, syncFromCharacter, setSuccess])

  const handleLevelUpComplete = useCallback(async (result: LevelUpResult) => {
    if (!id) return
    const body: Record<string, unknown> = {
      totalLevel: result.totalLevel,
      classes: result.classes,
      hitPoints: result.hitPoints,
      spells: result.spells,
      levelUpPending: false,
      pendingLevel: null,
    }
    if (result.subclassId) {
      body.subclassId = result.subclassId
    }
    const data = await apiFetch<{ character: CharacterDoc }>(`/api/characters/${id}`, {
      method: 'PATCH',
      body,
    })
    setCharacter(data.character)
    syncFromCharacter(data.character)
    notify(`${character?.name ?? 'Character'} has been advanced to level ${result.totalLevel}!`)
  }, [id, character?.name, setCharacter, syncFromCharacter, setSuccess])

  const handleCharacterStatusChange = useCallback(async (statusAction: {
    campaignMemberId: string
    campaignName: string
    newStatus: 'inactive' | 'deceased'
  }) => {
    try {
      await apiFetch(`/api/campaign-members/${statusAction.campaignMemberId}/character-status`, {
        method: 'PATCH',
        body: { characterStatus: statusAction.newStatus },
      })
      setCampaigns(prev =>
        prev.map(c =>
          c.campaignMemberId === statusAction.campaignMemberId
            ? { ...c, characterStatus: statusAction.newStatus }
            : c,
        ),
      )
      const label = statusAction.newStatus === 'deceased' ? 'marked as deceased' : 'set to inactive'
      notify(`${character?.name ?? 'Character'} has been ${label} in ${statusAction.campaignName}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update character status')
    }
  }, [character?.name, setCampaigns, setError, setSuccess])

  const handleReactivate = useCallback(async (campaignMemberId: string, campaignName: string) => {
    try {
      await apiFetch(`/api/campaign-members/${campaignMemberId}/character-status`, {
        method: 'PATCH',
        body: { characterStatus: 'active' },
      })
      setCampaigns(prev =>
        prev.map(c =>
          c.campaignMemberId === campaignMemberId
            ? { ...c, characterStatus: 'active' }
            : c,
        ),
      )
      notify(`${character?.name ?? 'Character'} has been reactivated in ${campaignName}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate character')
    }
  }, [character?.name, setCampaigns, setError, setSuccess])

  const handleDeleteCharacter = useCallback(async () => {
    if (!id) return
    await apiFetch(`/api/characters/${id}`, { method: 'DELETE' })
  }, [id])

  return {
    approvingId,
    saveCharacter,
    handleApprove,
    handleReject,
    handleAwardXp,
    handleCancelLevelUp,
    handleLevelUpComplete,
    handleCharacterStatusChange,
    handleReactivate,
    handleDeleteCharacter,
  }
}
