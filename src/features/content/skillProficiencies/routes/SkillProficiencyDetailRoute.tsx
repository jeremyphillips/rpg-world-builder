import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useCampaignRules } from '@/app/providers/CampaignRulesProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import {
  ContentDetailAdvancedAccordion,
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types';
import {
  fetchSkillProficiencyDetailEntry,
  SKILL_PROFICIENCY_DETAIL_SPECS,
} from '@/features/content/skillProficiencies/domain';
import type { SkillProficiency } from '@/features/content/skillProficiencies/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';

export default function SkillProficiencyDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { catalog } = useCampaignRules();
  const { skillProficiencyId } = useParams<{ skillProficiencyId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const fetchSkillProf = useCallback(
    (cid: string, sid: SystemRulesetId, key: string) =>
      fetchSkillProficiencyDetailEntry(cid, sid, key, catalog),
    [catalog],
  );

  const { entry: skillProficiency, loading, error, notFound } = useCampaignContentEntry<SkillProficiency>({
    campaignId: campaignId ?? undefined,
    entryKey: skillProficiencyId,
    fetchEntry: fetchSkillProf,
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

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: SKILL_PROFICIENCY_DETAIL_SPECS,
    item: skillProficiency,
    ctx: {},
    viewer,
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
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      <ContentDetailAdvancedAccordion
        items={advancedItems}
        sectionTitle="Advanced skill proficiency data"
        idPrefix="skill-proficiency"
      />
    </ContentDetailScaffold>
  );
}
