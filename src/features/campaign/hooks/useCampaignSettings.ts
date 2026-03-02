import { useEffect, useState } from 'react'
import { apiFetch } from '@/app/api'
import type { Campaign, CampaignIdentity } from '@/shared/types'

type CampaignResponse = {
  campaign: Campaign
}

export function useCampaignSettings(campaignId: string | null) {
  const [data, setData] = useState<CampaignIdentity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) return

    setLoading(true)
    setError(null)

    apiFetch<CampaignResponse>(`/api/campaigns/${campaignId}`)
      .then((res) => {
        const { identity, configuration } = res.campaign
        setData({
          name: identity.name ?? '',
          description: identity.description ?? '',
          imageKey: identity.imageKey ?? undefined,
          imageUrl: identity.imageUrl ?? undefined,
        })
      })
      .catch(() => setError('Failed to load campaign settings'))
      .finally(() => setLoading(false))
  }, [campaignId])

  return { data, loading, error }
}
