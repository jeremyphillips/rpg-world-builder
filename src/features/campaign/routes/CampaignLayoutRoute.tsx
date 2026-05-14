import { Outlet } from 'react-router-dom'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'

/** Campaign shell: loading gate + nested outlets (hub, world, sessions, …). */
export default function CampaignLayoutRoute() {
  const {
    campaign: activeCampaign,
    loading: activeCampaignLoading,
  } = useActiveCampaign()

  if (activeCampaignLoading) return <p>Loading campaign…</p>
  if (!activeCampaign) return <p>Campaign not found.</p>

  return <Outlet />
}
