import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/shared/components';
import type { Race } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { resolveImageUrl } from '@/utils/image';
import { buildDetailItemsFromSpecs } from '@/features/content/shared/forms/registry';
import { raceRepo, RACE_DETAIL_SPECS } from '@/features/content/races/domain';

export default function RaceDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { raceId } = useParams<{ raceId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { entry: race, loading, error, notFound } = useCampaignContentEntry<Race>({
    campaignId: campaignId ?? undefined,
    entryId: raceId,
    fetchEntry: raceRepo.getEntry,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !race) {
    return <AppAlert tone="danger">{error ?? 'Race not found.'}</AppAlert>;
  }

  const listPath = `/campaigns/${campaignId}/world/races`;
  const editPath = `${listPath}/${raceId}/edit`;

  const items = buildDetailItemsFromSpecs(RACE_DETAIL_SPECS, race, {});
console.log('race', race);
  return (
    <ContentDetailScaffold
      title={race.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canManage}
      source={race.source}
      accessPolicy={race.accessPolicy}
    >
      {race.patched && (
        <Box sx={{ mb: 2 }}>
          <AppBadge label="Patched" tone="warning" size="small" />
        </Box>
      )}

      {race.imageKey && (
        <Box sx={{ mb: 2 }}>
          <img src={resolveImageUrl(race.imageKey)} alt={race.name} style={{ maxHeight: 200 }} />
        </Box>
      )}

      {race.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
          {race.description}
        </Typography>
      )}

      <KeyValueSection
        title="Race Details"
        items={items}
        columns={2}
        sx={{ mt: 2 }}
      />
    </ContentDetailScaffold>
  );
}
