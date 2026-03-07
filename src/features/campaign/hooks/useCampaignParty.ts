import { useEffect, useState } from 'react'
import { apiFetch } from '@/app/api'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import type { CharacterRosterSummary } from '@/features/character/read-model'

/** Party member for use in the app (matches CharacterRosterSummary from API). */
export type PartyMember = CharacterRosterSummary

export function useCampaignParty(status: string = 'approved') {
  const { campaignId } = useActiveCampaign()

  const [party, setParty] = useState<PartyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignId) {
      setParty([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const params = new URLSearchParams()
    params.append('status', status)
    const url = `/api/campaigns/${campaignId}/party?${params.toString()}`

    apiFetch<{ characters?: CharacterRosterSummary[] }>(url, {
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return
        setParty(data.characters ?? [])
      })
      .catch(() => {
        if (!controller.signal.aborted) setParty([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [campaignId, status])

  return { party, loading }
}
