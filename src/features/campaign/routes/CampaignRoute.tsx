import { useState } from 'react'
import { Outlet, useMatch, Link } from 'react-router-dom'
import Button from '@mui/material/Button'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

import { apiFetch } from '@/app/api'
import { ROUTES } from '@/app/routes'
import { useAuth } from '@/app/providers/AuthProvider'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { CampaignPartySection } from '@/features/character/components'
import { AppAlert } from '@/ui/primitives'
import { FormModal, ConfirmModal, AppHero } from '@/ui/patterns'
import type { FieldConfig } from '@/ui/patterns'

type InviteFormData = { email: string }

type PreCheckResult = {
  status: 'ok' | 'no_account' | 'active_character' | 'already_member'
  userName?: string
}

const inviteFields: FieldConfig[] = [
  {
    type: 'text',
    name: 'email',
    label: 'Email Address',
    inputType: 'email',
    required: true,
    placeholder: 'player@example.com',
  },
]

const inviteDefaults: InviteFormData = { email: '' }

export default function CampaignRoute() {

  const {
    campaignId: activeCampaignId,
    campaign: activeCampaign,
    campaignName: activeCampaignName,
    loading: activeCampaignLoading,
  } = useActiveCampaign()

  const { user } = useAuth()
  const isExactCampaign = useMatch({ path: '/campaigns/:id', end: true })

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  // Confirm modal state (for active-character warning)
  const [confirmState, setConfirmState] = useState<{
    email: string
    userName: string
  } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const isOwner = activeCampaign?.membership.ownerId === user?.id

  async function sendInvite(email: string) {
    const data = await apiFetch<{ message?: string }>(
      `/api/campaigns/${activeCampaignId}/members`,
      { method: 'POST', body: { email } }
    )
    setInviteSuccess(data.message ?? 'Invite sent')
    // await fetchCampaign()
  }

  async function handleInviteSubmit({ email }: InviteFormData) {
    // Pre-check before sending
    const check = await apiFetch<PreCheckResult>(
      `/api/campaigns/${activeCampaignId}/members/pre-check`,
      { method: 'POST', body: { email } }
    )

    if (check.status === 'already_member') {
      throw new Error(`${check.userName ?? email} is already a member of this campaign.`)
    }

    if (check.status === 'active_character') {
      // Close form modal, open confirm modal
      setInviteOpen(false)
      setConfirmState({ email, userName: check.userName ?? email })
      return
    }

    // 'ok' or 'no_account' — proceed directly
    await sendInvite(email)
  }

  async function handleConfirmInvite() {
    if (!confirmState) return
    setConfirming(true)
    try {
      await sendInvite(confirmState.email)
      setConfirmState(null)
    } catch {
      setConfirmState(null)
    } finally {
      setConfirming(false)
    }
  }

  if (activeCampaignLoading) return <p>Loading campaign…</p>
  if (!activeCampaign) return <p>Campaign not found.</p>

  // Render child route (e.g. sessions) when URL goes deeper than /campaigns/:id
  if (!isExactCampaign) return <Outlet />

  const subheadline = `${activeCampaign.memberCount} member${activeCampaign.memberCount !== 1 ? 's' : ''}`

  return (
    <div>
      <AppHero
        headline={activeCampaignName ?? ''}
        subheadline={subheadline}
        image={activeCampaign.identity?.imageUrl}
      />

      <h3>Campaign</h3>

      {isOwner && (
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={() => { setInviteSuccess(null); setInviteOpen(true) }}
        >
          Invite User
        </Button>
      )}

      {inviteSuccess && (
        <AppAlert tone="success" onClose={() => setInviteSuccess(null)} sx={{ mt: 2 }}>
          {inviteSuccess}
        </AppAlert>
      )}

      <h3>Sessions</h3>
      <Link to={ROUTES.SESSIONS.replace(':id', activeCampaignId!)}>View Sessions</Link>

      <CampaignPartySection approvalStatus="approved" />
      <CampaignPartySection approvalStatus="pending" />

      {/* Invite User modal */}
      <FormModal<InviteFormData>
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={handleInviteSubmit}
        headline="Invite User"
        description="Enter the email address of the player you'd like to invite to this campaign."
        fields={inviteFields}
        defaultValues={inviteDefaults}
        submitLabel="Invite"
        cancelLabel="Cancel"
        size="compact"
      />

      {/* Active character confirmation */}
      <ConfirmModal
        open={!!confirmState}
        onCancel={() => setConfirmState(null)}
        onConfirm={handleConfirmInvite}
        headline="Player Already Active"
        description={
          confirmState
            ? `${confirmState.userName} already has an active character in ${activeCampaign?.identity?.name}. Do you want to proceed?`
            : ''
        }
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        confirmColor="warning"
        loading={confirming}
      />
    </div>
  )
}
