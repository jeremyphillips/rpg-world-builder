import { useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import CampaignForm, { type CampaignFormData } from '@/features/campaign/components/CampaignForm/CampaignForm'
import { CampaignHorizontalCard} from '@/features/campaign/components'
import Box from '@mui/material/Box'
import { useCampaigns } from '@/features/campaign/hooks'
// import { toViewerContext } from '@/shared/domain/capabilities'

export default function CampaignsRoute() {
  const { user } = useAuth()
  const { 
    campaigns, 
    loading: loadingCampaigns, 
    createCampaign
  } = useCampaigns()
  const canCreate = user?.role === 'admin' || user?.role === 'superadmin'
  const [showCreateForm, setShowCreateForm] = useState(false)

  async function handleCreate(data: CampaignFormData) {
    await createCampaign(data)
    setShowCreateForm(false)
  }

  if (loadingCampaigns) return <p>Loading campaigns...</p>

  return (
    <Box>
      <div className="page-header">
        <h1>Campaigns</h1>
        {canCreate && !showCreateForm && (
          <button onClick={() => setShowCreateForm(true)}>
            + New Campaign
          </button>
        )}
      </div>

      {showCreateForm && (
        <>
          <h3>Create Campaign</h3>
          <CampaignForm
            initial={{ name: '' }}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitLabel="Create…"
          />
        </>
      )}

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
              imageUrl={c.identity?.imageKey}
            />
          ))}
        </div>
      )}
    </Box>
  )
}
