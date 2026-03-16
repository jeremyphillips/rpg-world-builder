import { useParams, useLocation, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import MuiLink from '@mui/material/Link'

import { Breadcrumbs } from '@/ui/patterns'
import { useBreadcrumbs } from '@/app/navigation'
import { ROUTES } from '@/app/routes'
import { useCharacter } from '@/features/character/hooks'
import { useCharacterForm } from '@/features/character/hooks'
import { useCharacterActions } from '@/features/character/hooks'
import { CharacterView } from '@/features/character/components/views'
import { AppAlert } from '@/ui/primitives';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities'
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'

export default function CharacterRoute() {
  const { campaign } = useActiveCampaign()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()

  const viewerCharacterIds = campaign?.members?.viewerCharacterIds ?? [];
  const ctx = toViewerContext(campaign?.viewer, viewerCharacterIds);
  const canManage = canManageContent(ctx);
  const userOwnsCharacter = viewerCharacterIds.includes(id ?? '');


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
      isOwner={userOwnsCharacter}
      isAdmin={canManage}
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
