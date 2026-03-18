import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { ROUTES } from '@/app/routes'

export default function EncounterGuard() {
  const { user } = useAuth()
  const { campaign, loading } = useActiveCampaign()

  if (!user) return <Navigate to={ROUTES.LOGIN} replace />
  if (loading) return null

  const canAccess = Boolean(campaign?.viewer?.isOwner || campaign?.viewer?.isPlatformAdmin)
  if (!canAccess) return <Navigate to={ROUTES.DASHBOARD} replace />

  return <Outlet />
}
