import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { useActiveCampaignCanManageContent } from '@/app/providers/useActiveCampaignCanManageContent';
import { useActiveCampaignViewerContext } from '@/app/providers/useActiveCampaignViewerContext';
import {
  ContentDetailAdvancedAccordion,
  ContentDetailImageKeyValueGrid,
  ContentDetailMetaRow,
  ContentDetailScaffold,
} from '@/features/content/shared/components';
import { classRepo, type ClassContentItem } from '@/features/content/classes/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/app/navigation';
import { AppAlert } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import {
  buildContentDetailSectionsFromSpecs,
  toDetailSpecViewer,
} from '@/features/content/shared/forms/registry';
import { CLASS_DETAIL_SPECS } from '@/features/content/classes/domain/forms';

export default function ClassDetailRoute() {
  const { campaignId } = useActiveCampaign();
  const canManage = useActiveCampaignCanManageContent();
  const viewerContext = useActiveCampaignViewerContext();
  const { classId } = useParams<{ classId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const { entry: charClass, loading, error, notFound } = useCampaignContentEntry<ClassContentItem>({
    campaignId: campaignId ?? undefined,
    entryId: classId,
    fetchEntry: classRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !charClass) {
    return <AppAlert tone="danger">{error ?? 'Class not found.'}</AppAlert>;
  }

  const editPath = `/campaigns/${campaignId}/world/classes/${classId}/edit`;

  const viewer = toDetailSpecViewer(viewerContext);
  const { metaItems, mainItems, advancedItems } = buildContentDetailSectionsFromSpecs({
    specs: CLASS_DETAIL_SPECS,
    item: charClass,
    ctx: {},
    viewer,
  });

  const source = charClass.source ?? 'system';

  return (
    <ContentDetailScaffold
      title={charClass.name}
      breadcrumbData={breadcrumbs}
      editPath={editPath}
      canManage={canManage}
      source={source}
      accessPolicy={charClass.accessPolicy}
      hideAccessPolicyBadge
    >
      <ContentDetailMetaRow items={metaItems} />

      <ContentDetailImageKeyValueGrid
        imageContentType="class"
        imageKey={charClass.imageKey}
        alt={charClass.name}
      >
        <KeyValueSection title="" items={mainItems} columns={2} />
      </ContentDetailImageKeyValueGrid>

      <ContentDetailAdvancedAccordion
        items={advancedItems}
        sectionTitle="Advanced class data"
        idPrefix="class"
      />
    </ContentDetailScaffold>
  );
}
