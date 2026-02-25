import { useAuth } from '@/app/providers/AuthProvider'
import { CampaignHorizontalCard }from '@/features/campaign/components'
import { useCampaigns } from '@/features/campaign/hooks'
import { Typography } from '@mui/material'

export default function DashboardRoute() {
  const { user } = useAuth()
  const { campaigns } = useCampaigns()

  return (
    <div>
      <Typography variant="h1" sx={{ mb: 4 }}>Welcome, {user?.firstName ? user?.firstName : user?.username}</Typography>

      <Typography variant="h2" sx={{ mb: 4 }}>Your Campaigns</Typography>
      
      {campaigns.length === 0 ? (
        <p className="empty-state">No campaigns yet.</p>
      ) : (
        <div className="item-list">
          {campaigns.map((c) => (
            <CampaignHorizontalCard
              key={c._id}
              campaignId={c._id}
              name={c.identity.name ?? ''}
              description={c.identity.description}
              memberCount={c.memberCount}
              imageUrl={c.identity?.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}
