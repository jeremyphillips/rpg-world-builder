import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider'
import { ContentDetailScaffold } from '@/features/content/components'
import { skillProficiencyRepo } from '@/features/content/domain/repo'
import type { SkillProficiency } from '@/features/content/domain/types'
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry'
import { useBreadcrumbs } from '@/hooks'
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities'
import { AppAlert, AppBadge } from '@/ui/primitives'
import { KeyValueSection } from '@/ui/patterns'
import { buildDetailItemsFromSpecs } from '@/features/content/forms/registry'
import { SKILL_PROFICIENCY_DETAIL_SPECS } from '@/features/skillProficiency/forms'

export default function SkillProficiencyDetailRoute() {
  const { campaign, campaignId } = useActiveCampaign()
  const { skillProficiencyId } = useParams<{ skillProficiencyId: string }>()
  const breadcrumbs = useBreadcrumbs()

  const ctx = toViewerContext(campaign?.viewer)
  const canManage = canManageContent(ctx)

  const { entry: skillProficiency, loading, error, notFound } = useCampaignContentEntry<SkillProficiency>({
    campaignId: campaignId ?? undefined,
    entryId: skillProficiencyId,
    fetchEntry: skillProficiencyRepo.getEntry,
  })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || notFound || !skillProficiency) {
    return <AppAlert tone="danger">{error ?? 'Skill proficiency not found.'}</AppAlert>
  }

  const listPath = `/campaigns/${campaignId}/world/skill-proficiencies`
  const editPath = `${listPath}/${skillProficiencyId}/edit`

  const items = buildDetailItemsFromSpecs(SKILL_PROFICIENCY_DETAIL_SPECS, skillProficiency, {})

  return (
    <ContentDetailScaffold
      title={skillProficiency.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={skillProficiency.source}
      accessPolicy={skillProficiency.accessPolicy}
    >
      {skillProficiency.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {skillProficiency.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {skillProficiency.description}
        </Typography>
      )}

      <KeyValueSection
        title="Skill Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  )
}
