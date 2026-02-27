import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentTypeListPage } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks/useCampaignMembers';
import { raceRepo } from '@/features/content/domain/repo';
import { toViewerContext, canManageCampaignContent } from '@/shared/domain/capabilities';
import { useCampaignContentListController } from '@/features/content/hooks/useCampaignContentListController';

export default function RaceListRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { viewerCharacterIds } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const ctx = toViewerContext(viewer);
  const canManage = canManageCampaignContent(ctx);

  const {
    items,
    loading,
    error,
    viewerContext,
    onToggleAllowed,
    getDetailLink,
    onAdd,
  } = useCampaignContentListController({
    campaignId,
    viewer,
    viewerCharacterIds,
    canManage,
    listSummaries: raceRepo.listSummaries,
    contentKey: 'races',
    basePath: `/campaigns/${campaignId}/world/races`,
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <ContentTypeListPage
      typeLabel="Race"
      typeLabelPlural="Races"
      items={items}
      getDetailLink={getDetailLink}
      onToggleAllowed={onToggleAllowed}
      onAdd={onAdd}
      canManage={canManage}
      viewerContext={viewerContext}
    />
  );
}
