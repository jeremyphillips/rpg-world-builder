import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { RouteContentSuspenseFallback } from '@/app/RouteContentSuspenseFallback'

/** Campaign shell: loading gate + nested outlets (hub, world, sessions, …). */
export default function CampaignLayoutRoute() {
  const {
    campaign: activeCampaign,
    loading: activeCampaignLoading,
  } = useActiveCampaign()

  if (activeCampaignLoading) return <p>Loading campaign…</p>
  if (!activeCampaign) return <p>Campaign not found.</p>

  return (
    <Suspense fallback={<RouteContentSuspenseFallback />}>
      <Outlet />
    </Suspense>
  )
}
