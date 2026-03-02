import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { CharacterBuilderWizard } from '@/features/characterBuilder/components'
import { useCharacterBuilder } from '@/features/characterBuilder/context'
import { apiFetch } from '@/app/api'
import { ROUTES } from '@/app/routes'
import type { InviteCampaignState } from '@/features/auth/invite'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppAlert } from '@/ui/primitives'

export default function NewCharacterRoute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const campaignId = searchParams.get('campaignId')
  const locState = (location.state ?? {}) as InviteCampaignState

  const { state: builderState, openBuilder } = useCharacterBuilder()

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return

    openBuilder('pc')
    setInitialized(true)
  }, [initialized, openBuilder])

  const handleGenerate = useCallback(async () => {
    setSaving(true)
    setSaveError(null)

    try {
      const body: Record<string, unknown> = {
        name: builderState.name ?? 'Unnamed Character',
        type: builderState.type ?? 'pc',
        race: builderState.race ?? '',
        classes: builderState.classes ?? [],
        totalLevel: builderState.totalLevel ?? 1,
        alignment: builderState.alignment ?? '',
        xp: builderState.xp ?? 0,
        equipment: builderState.equipment,
        wealth: builderState.wealth,
        proficiencies: builderState.proficiencies ?? { skills: [] },
        spells: builderState.spells ?? [],
      }

      if (campaignId) {
        body.campaignId = campaignId
      }

      const res = await apiFetch<{ character: { _id: string } }>('/api/characters', {
        method: 'POST',
        body,
      })

      navigate(
        ROUTES.CHARACTER.replace(':id', res.character._id),
        {
          replace: true,
          state: campaignId && locState.campaignName
            ? { welcomeCampaign: locState.campaignName, campaignId }
            : undefined,
        },
      )
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save character')
    } finally {
      setSaving(false)
    }
  }, [builderState, campaignId, locState.campaignName, navigate])

  if (!initialized) return null

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        New Character
      </Typography>

      {locState.campaignName && (
        <AppAlert tone="info" sx={{ mb: 3 }}>
          Create a character to join <strong>{locState.campaignName}</strong>&apos;s party.
        </AppAlert>
      )}

      {saveError && (
        <AppAlert tone="danger" sx={{ mb: 2 }} onClose={setSaveError(null)}>
          {saveError}
        </AppAlert>
      )}

      <CharacterBuilderWizard
        onGenerate={handleGenerate}
        isGenerating={saving}
        onCancel={() => navigate(ROUTES.CHARACTERS)}
      >
        {({ content, actions }) => (
          <Box>
            <Box sx={{ mb: 4 }}>{content}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {actions}
            </Box>
          </Box>
        )}
      </CharacterBuilderWizard>
    </Box>
  )
}
