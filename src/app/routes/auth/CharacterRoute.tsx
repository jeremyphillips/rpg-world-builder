import { useParams, useLocation, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import MuiLink from '@mui/material/Link'

import { Breadcrumbs } from '@/ui/patterns'
import { useAuth } from '@/app/providers/AuthProvider'
import { useBreadcrumbs } from '@/hooks'
import { ROUTES } from '@/app/routes'
import { useCharacter } from '@/features/character/hooks'
import { useCharacterForm } from '@/features/character/hooks'
import { useCharacterActions } from '@/features/character/hooks'
import { CharacterView } from '@/features/character/view'
import { AppAlert } from '@/ui/primitives';

export default function CharacterRoute() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const isPlatformAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const breadcrumbs = useBreadcrumbs()

  const welcomeState = location.state as { welcomeCampaign?: string; campaignId?: string } | null

  // ── Data + form + action hooks ──────────────────────────────────────
  const state = useCharacter(id)
  const form = useCharacterForm(state.character)
  const actions = useCharacterActions(id, {
    character: state.character,
    setCharacter: state.setCharacter,
    setCampaigns: state.setCampaigns,
    setPendingMemberships: state.setPendingMemberships,
    setError: state.setError,
    setSuccess: state.setSuccess,
    syncFromCharacter: form.syncFromCharacter,
  })

  // ── Render guards ──────────────────────────────────────────────────
  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (state.error && !state.character) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', mt: 4 }}>
        <AppAlert tone="danger">{state.error}</AppAlert>
      </Box>
    )
  }

  if (!state.character) return null

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      
      {welcomeState?.welcomeCampaign && (
        <AppAlert tone="success" sx={{ mb: 2 }}>
          <>Welcome to {welcomeState.welcomeCampaign}!</>
          Your character activation is pending review from the DM.{' '}
          {welcomeState.campaignId && (
            <MuiLink
              component={Link}
              to={ROUTES.CAMPAIGN.replace(':id', welcomeState.campaignId)}
            >
              View campaign
            </MuiLink>
          )}
        </AppAlert>
      )}
    <CharacterView
      character={state.character}
      campaigns={state.campaigns}
      pendingMemberships={state.pendingMemberships}
      isOwner={state.isOwner}
      isAdmin={state.isAdmin}
      isPlatformAdmin={isPlatformAdmin}
      ownerName={state.ownerName}
      error={state.error}
      success={state.success}
      setError={state.setError}
      name={form.name}
      imageKey={form.imageKey}
      setImageKey={form.setImageKey}
      narrative={form.narrative}
      race={form.race}
      alignment={form.alignment}
      totalLevel={form.totalLevel}
      alignmentOptions={form.alignmentOptions}
      raceOptions={form.raceOptions}
      actions={actions}
      breadcrumbs={breadcrumbs}
    />
    </>
  )
}
