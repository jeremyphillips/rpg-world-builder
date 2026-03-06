import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import { classRepo, type ClassContentItem } from '@/features/content/classes/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { CLASS_DETAIL_SPECS } from '@/features/content/classes/domain/forms';

export default function ClassDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { classId } = useParams<{ classId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

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

  const listPath = `/campaigns/${campaignId}/world/classes`;
  const editPath = `${listPath}/${classId}/edit`;

  const items = buildDetailItemsFromSpecs(CLASS_DETAIL_SPECS, charClass, {});

  const source = charClass.source ?? 'system';

  return (
    <ContentDetailScaffold
      title={charClass.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={source}
      accessPolicy={charClass.accessPolicy}
    >
      {charClass.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {charClass.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {charClass.description}
        </Typography>
      )}

      <KeyValueSection
        title="Class Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
