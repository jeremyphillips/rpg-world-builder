import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { ROUTES } from '@/app/routes'
import { apiFetch } from '@/app/api'
import { useState, useEffect } from 'react'
import type { CampaignViewer } from '@/shared/types/campaign.types'

type CampaignWithViewer = { _id: string; viewer?: CampaignViewer }

export default function AdminGuard() {
  const { user } = useAuth()
  const { campaignId: activeCampaignId } = useActiveCampaign()
  const [canAccess, setCanAccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user || !activeCampaignId) {
      setCanAccess(false)
      setChecking(false)
      return
    }
    apiFetch<{ campaign?: CampaignWithViewer }>(`/api/campaigns/${activeCampaignId}`)
      .then((data) => {
        const viewer = data.campaign?.viewer
        setCanAccess(viewer?.isOwner || viewer?.isPlatformAdmin || false)
      })
      .catch(() => setCanAccess(false))
      .finally(() => setChecking(false))
  }, [user, activeCampaignId])

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (checking) return null
  if (!canAccess) return <Navigate to={ROUTES.DASHBOARD} replace />

  return <Outlet />
}
