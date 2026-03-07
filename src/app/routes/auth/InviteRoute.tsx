import { useState, useEffect, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useParams } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { apiFetch } from '@/app/api'
import { InviteConfirmationBox } from '@/features/campaign/invite'
import { getCharacterOptionLabel } from '@/features/character/helpers'
import { CampaignHorizontalCard } from '@/features/campaign/components'
import { useAvailableCharacters } from '@/features/character/hooks'
import type { FieldConfig } from '@/ui/patterns'
import { AppAlert } from '@/ui/primitives';

interface InviteData {
  _id: string
  campaignId: string
  invitedByName: string
  role: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: string
  respondedAt: string | null
  campaign: {
    _id: string
    name: string
    setting?: string
    description?: string
  } | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function InviteRoute() {
  const { inviteId } = useParams<{ inviteId: string }>()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState(false)

  // ── Load invite ────────────────────────────────────────────────────
  useEffect(() => {
    if (!inviteId) return
    setLoading(true)
    apiFetch<{ invite: InviteData }>(`/api/invites/${inviteId}`)
      .then((data) => setInvite(data.invite))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [inviteId])

  // ── Load available characters when invite is pending ─────────────────
  const { availableCharacters } = useAvailableCharacters(invite?.status === 'pending')

  const characterOptions = useMemo(() => {
    return availableCharacters.map((c) => ({
      value: c.id,
      label: getCharacterOptionLabel(c),
    }))
  }, [availableCharacters])

  // ── Sync form values back to local state ───────────────────────────
  const handleFormValuesChange = useCallback(
    (values: Record<string, unknown>) => {
      const charId = (values.characterId as string) ?? ''
      if (charId !== selectedCharacterId) setSelectedCharacterId(charId)
    },
    [selectedCharacterId],
  )

  // ── Respond ────────────────────────────────────────────────────────
  async function handleRespond(action: 'accept' | 'decline') {
    if (!inviteId) return
    if (action === 'accept' && characterOptions.length > 0 && !selectedCharacterId) return
    setResponding(true)
    try {
      const body: { action: 'accept' | 'decline'; characterId?: string } = { action }
      if (action === 'accept' && selectedCharacterId) body.characterId = selectedCharacterId
      const data = await apiFetch<{ invite: { status: InviteData['status']; respondedAt: string | null } }>(
        `/api/invites/${inviteId}/respond`,
        { method: 'POST', body },
      )
      setInvite((prev) => (prev ? { ...prev, status: data.invite.status, respondedAt: data.invite.respondedAt } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setResponding(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !invite) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}>
        <AppAlert tone="danger">{error ?? 'Invite not found'}</AppAlert>
      </Box>
    )
  }

  // ── Build form fields for character select ─────────────────────────

  const formFields: FieldConfig[] =
    characterOptions.length > 0
      ? [
          {
            type: 'select' as const,
            name: 'characterId',
            label: 'Character to join with',
            options: characterOptions,
            placeholder: 'Select a character',
            required: true,
          },
        ]
      : []

  return (
    <InviteConfirmationBox
      headline="Campaign Invite"
      invitedByLabel={`${invite.invitedByName} invited you to join`}
      status={invite.status}
      responding={responding}
      onRespond={handleRespond}
      formFields={formFields}
      formDefaultValues={{ characterId: '' }}
      onFormValuesChange={handleFormValuesChange}
      campaignCard={
        invite.campaign ? (
          <CampaignHorizontalCard
            campaignId={invite.campaign._id}
            name={invite.campaign.name}
            description={invite.campaign.description}
          />
        ) : undefined
      }
      acceptedLink={
        invite.campaign
          ? { to: ROUTES.CAMPAIGN.replace(':id', invite.campaign._id), label: 'Go to Campaign' }
          : undefined
      }
      acceptedMessage="Invite accepted. Your character is pending DM approval."
      footer={`Sent ${new Date(invite.createdAt).toLocaleDateString()}`}
    />
  )
}
