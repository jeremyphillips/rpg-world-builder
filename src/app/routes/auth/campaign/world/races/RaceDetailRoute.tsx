import { useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/components';
import { raceRepo } from '@/features/content/domain/repo';
import type { Race } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageCampaignContent } from '@/shared/domain/capabilities';

export default function RaceDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { raceId } = useParams<{ raceId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageCampaignContent(ctx);

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
    return <Alert severity="error">{error ?? 'Race not found.'}</Alert>;
  }

  const listPath = `/campaigns/${campaignId}/world/races`;
  const editPath = `${listPath}/${raceId}/edit`;
  const canEdit = canManage && race.source === 'campaign';

  return (
    <ContentDetailScaffold
      title={race.name}
      breadcrumbData={breadcrumbs}
      listPath={listPath}
      editPath={editPath}
      canEdit={canEdit}
      source={race.source}
      accessPolicy={race.accessPolicy}
    >
      {race.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {race.description}
        </Typography>
      )}
    </ContentDetailScaffold>
  );
}
