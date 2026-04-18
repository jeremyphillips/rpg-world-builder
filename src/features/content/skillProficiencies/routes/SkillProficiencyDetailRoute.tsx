import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import {
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import {
  skillProficiencyRepo,
  SKILL_PROFICIENCY_DETAIL_SPECS,
} from '@/features/content/skillProficiencies/domain';
import type { SkillProficiency } from '@/features/content/skillProficiencies/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildContentDetailSectionsFromSpecs } from '@/features/content/shared/forms/registry';

export default function SkillProficiencyDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { skillProficiencyId } = useParams<{ skillProficiencyId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: skillProficiency, loading, error, notFound } = useCampaignContentEntry<SkillProficiency>({
    campaignId: campaignId ?? undefined,
    entryId: skillProficiencyId,
    fetchEntry: skillProficiencyRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !skillProficiency) {
    return <AppAlert tone="danger">{error ?? 'Skill proficiency not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/skill-proficiencies/${skillProficiencyId}/edit`;

  const { metaItems, mainItems } = buildContentDetailSectionsFromSpecs({
    specs: SKILL_PROFICIENCY_DETAIL_SPECS,
    item: skillProficiency,
    ctx: {},
    viewerContext,
  });

  return (
    <ContentDetailScaffold
      title={skillProficiency.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={skillProficiency.source}
      accessPolicy={skillProficiency.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="skillProficiencies"
        imageKey={skillProficiency.imageKey}
        alt={skillProficiency.name}
      >
        <KeyValueSection title="Skill Details" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      {skillProficiency.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3, mt: 2 }}>
          {skillProficiency.description}
        </Typography>
      )}
    </ContentDetailScaffold>
  );
}
