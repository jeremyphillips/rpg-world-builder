import type { CharacterDoc, CharacterClassInfo } from '@/shared'
import type { CampaignSummary } from '@/shared/types/campaign.types'
import type { EditionId } from '@/data'
import { classes as classesData, editions, settings, races } from '@/data'
import { getNameById, getById } from '@/domain/lookups'
import { getSubclassNameById } from '@/features/character/domain/reference'
import { getXpByLevelAndEdition } from '@/features/mechanics/domain/progression'
import { CampaignHorizontalCard }from '@/features/campaign/components'
import {
  ImageUploadField,
  EditableTextField,
  EditableNumberField,
  EditableSelect
} from '@/ui/fields'
import type { Race, Alignment } from '@/data/types'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
// import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import EditIcon from '@mui/icons-material/Edit'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClassName(classId?: string): string {
  if (!classId) return 'Unknown'
  const c = getById(classesData, classId)
  return c?.name ?? classId
}

function getAlignmentName(options: { id: string; label: string }[], id: string | undefined): string {
  if (!id) return '—'
  return getById(options, id)?.label ?? id
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IdentityBannerProps = {
  character: CharacterDoc
  filledClasses: CharacterClassInfo[]
  campaigns: CampaignSummary[]
  imageKey: string | null
  name: string
  totalLevel: number
  alignmentOptions: { id: string; label: string }[]
  raceOptions: { id: string; label: string }[]
  canEdit: boolean
  canEditAll: boolean
  isOwner: boolean
  isAdmin: boolean
  onSave: (partial: Record<string, unknown>) => Promise<void>
  onSetImageKey: (key: string | null) => void
  onAwardXpOpen: () => void
  onSetStatusAction: (action: { campaignMemberId: string; campaignName: string; newStatus: 'inactive' | 'deceased' }) => void
  onReactivate: (campaignMemberId: string, campaignName: string) => Promise<void>
  onEditAlignment?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IdentityBanner({
  character,
  filledClasses,
  campaigns,
  imageKey,
  name,
  totalLevel,
  alignmentOptions,
  raceOptions,
  canEdit,
  canEditAll,
  isOwner,
  isAdmin,
  onSave,
  onSetImageKey,
  onAwardXpOpen,
  onSetStatusAction,
  onReactivate,
  onEditAlignment,
}: IdentityBannerProps) {
  // const editionName = getNameById(editions as unknown as { id: string; name: string }[], character.edition) ?? character.edition ?? '—'
  // const settingName = getNameById(settings as unknown as { id: string; name: string }[], character.setting) ?? character.setting ?? '—'
  const raceName = (getNameById(races as unknown as { id: string; name: string }[], character.race) ?? character.race) || '—'
  const alignmentName = getAlignmentName(alignmentOptions, character.alignment)
  const currentLevel = character.totalLevel ?? character.level ?? 1
  const primaryClassId = filledClasses[0]?.classId
  const editionObj = editions.find(e => e.id === character.edition)
  const maxLevel = editionObj?.progression?.maxLevel ?? 20

  const classSummary = filledClasses.length > 0
    ? filledClasses.map(cls => {
        const sub = getSubclassNameById(cls.classId, cls.classDefinitionId)
        return `${getClassName(cls.classId)}${sub ? ` (${sub})` : ''} ${cls.level}`
      }).join(' / ')
    : character.class
      ? `${character.class} ${character.level}`
      : '—'

  const isPendingLevelUp = character.levelUpPending && character.pendingLevel
  let xpDescription: string | undefined
  if (isPendingLevelUp) {
    const effectiveLevel = character.pendingLevel!
    if (effectiveLevel >= maxLevel) {
      xpDescription = `Level-up to ${effectiveLevel} pending · Max level`
    } else {
      const beyondPendingXp = getXpByLevelAndEdition(effectiveLevel + 1, character.edition as EditionId, primaryClassId)
      xpDescription = beyondPendingXp > 0
        ? `Level-up to ${effectiveLevel} pending · ${beyondPendingXp.toLocaleString()} XP for level ${effectiveLevel + 1}`
        : `Level-up to ${effectiveLevel} pending`
    }
  } else if (currentLevel >= maxLevel) {
    xpDescription = `Max level (${maxLevel}) reached`
  } else {
    const nextLevelXp = getXpByLevelAndEdition(currentLevel + 1, character.edition as EditionId, primaryClassId)
    if (nextLevelXp > 0) {
      xpDescription = `${nextLevelXp.toLocaleString()} XP required for level ${currentLevel + 1}`
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
          {/* Portrait */}
          <Box sx={{ width: { xs: '100%', sm: 160 }, flexShrink: 0 }}>
            <ImageUploadField
              value={imageKey}
              onChange={(key) => { onSetImageKey(key); onSave({ imageKey: key }) }}
              label=""
              disabled={!canEdit}
              maxHeight={180}
            />
          </Box>

          {/* Identity text */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <EditableTextField
              label="Character Name"
              value={name}
              onSave={(v: string) => onSave({ name: v })}
              disabled={!canEdit}
            />

            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {classSummary}
            </Typography>

            {/* <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip label={raceName} size="small" variant="outlined" />
              <Chip label={alignmentName} size="small" variant="outlined" />
              <Chip label={editionName} size="small" variant="outlined" />
              <Chip label={settingName} size="small" variant="outlined" />
            </Stack> */}

            <Divider sx={{ my: 1.5 }} />
            <Grid container columns={12} spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Race
                </Typography>
                <Typography variant="body1" fontWeight={600}>{raceName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Alignment
                  </Typography>
                  {onEditAlignment && (
                    <IconButton size="small" onClick={onEditAlignment} sx={{ mt: -0.5 }}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </Stack>
                <Typography variant="body1" fontWeight={600}>{alignmentName}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Level
                </Typography>
                <Typography variant="body1" fontWeight={600}>{totalLevel}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>XP</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1" fontWeight={600}>{(character.xp ?? 0).toLocaleString()}</Typography>
                  {canEditAll && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={onAwardXpOpen}
                      disabled={!!isPendingLevelUp}
                    >
                      Award XP
                    </Button>
                  )}
                </Stack>
                {xpDescription && (
                  <Typography variant="caption" color="text.secondary">{xpDescription}</Typography>
                )}
              </Grid>
            </Grid>

            {/* Campaigns */}
            {campaigns.length > 0 && (
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  Campaigns
                </Typography>
                {campaigns.map(c => {
                  const charStatus = (c.characterStatus ?? 'active') as string
                  const isActive = charStatus === 'active'

                  const campaignActions = (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {isAdmin && c.campaignMemberId && isActive && (
                        <>
                          <Typography
                            variant="body2"
                            color="warning.main"
                            sx={{ fontSize: '0.75rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.preventDefault(); onSetStatusAction({ campaignMemberId: c.campaignMemberId!, campaignName: c.identity.name, newStatus: 'inactive' }) }}
                          >
                            Set inactive
                          </Typography>
                          <Typography
                            variant="body2"
                            color="error.main"
                            sx={{ fontSize: '0.75rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.preventDefault(); onSetStatusAction({ campaignMemberId: c.campaignMemberId!, campaignName: c.identity.name, newStatus: 'deceased' }) }}
                          >
                            Mark deceased
                          </Typography>
                        </>
                      )}
                      {isAdmin && c.campaignMemberId && !isActive && (
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ fontSize: '0.75rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={(e) => { e.preventDefault(); onReactivate(c.campaignMemberId!, c.identity.name) }}
                        >
                          Reactivate
                        </Typography>
                      )}
                      {isOwner && !isAdmin && c.campaignMemberId && isActive && (
                        <Typography
                          variant="body2"
                          color="warning.main"
                          sx={{ fontSize: '0.75rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={(e) => { e.preventDefault(); onSetStatusAction({ campaignMemberId: c.campaignMemberId!, campaignName: c.identity.name, newStatus: 'inactive' }) }}
                        >
                          Leave campaign
                        </Typography>
                      )}
                    </Stack>
                  )

                  return (
                    <CampaignHorizontalCard
                      key={c._id}
                      campaignId={c._id}
                      name={c.identity.name}
                      description={c.identity.description}
                      imageUrl={c.identity.imageUrl}
                      dmName={c.dmName}
                      edition={c.identity.edition}
                      setting={c.identity.setting}
                      memberCount={c.memberCount}
                      characterStatus={charStatus !== 'active' ? charStatus : undefined}
                      actions={campaignActions}
                    />
                  )
                })}
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
