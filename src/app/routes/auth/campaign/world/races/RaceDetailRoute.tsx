import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { ContentDetailScaffold } from '@/features/content/components';
import SystemContentPatchModal from '@/features/content/components/SystemContentPatchModal';
import { raceRepo } from '@/features/content/domain/repo';
import type { Race } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageContent } from '@/shared/domain/capabilities';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { KeyValueSection } from '@/ui/patterns';
import { VisibilityBadge } from '@/ui/patterns';
import { resolveImageUrl } from '@/utils/image'

// TODO: reuse SystemContentPatchModal for other system content detail routes (equipment, spells, etc.)

export default function RaceDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { raceId } = useParams<{ raceId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageContent(ctx);

  const { entry: race, loading, error, notFound, refetch } = useCampaignContentEntry<Race>({
    campaignId: campaignId ?? undefined,
    entryId: raceId,
    fetchEntry: raceRepo.getEntry,
  });

  const [patchModalOpen, setPatchModalOpen] = useState(false);

  const handlePatchModalClose = useCallback(
    (changed?: boolean) => {
      setPatchModalOpen(false);
      if (changed) refetch();
    },
    [refetch],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || notFound || !race) {
    return <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}><AppAlert tone="danger">{error ?? 'Race not found.'}</AppAlert></Box>;
  }

  const listPath = `/campaigns/${campaignId}/world/races`;
  const editPath = `${listPath}/${raceId}/edit`;
  const canEdit = canManage && race.source === 'campaign';
  const canPatch = canManage && race.source === 'system';

  return (
    <>
      <ContentDetailScaffold
        title={race.name}
        breadcrumbData={breadcrumbs}
        listPath={listPath}
        editPath={editPath}
        canEdit={canEdit}
        source={race.source}
        accessPolicy={race.accessPolicy}
      >
        {canPatch && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            {race.patched && (
              <AppBadge label="Patched" tone="warning" size="small" />
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={() => setPatchModalOpen(true)}
            >
              {race.patched ? 'Edit patch' : 'Patch'}
            </Button>
          </Stack>
        )}

        {!canPatch && race.patched && (
          <Box sx={{ mb: 2 }}>
            <AppBadge label="Patched" tone="warning" size="small" />
          </Box>
        )}

        {race?.imageKey && (
          <Box sx={{ mb: 2 }}>
            <img src={resolveImageUrl(race.imageKey)} alt={race.name} />
          </Box>
        )}

        {race.description && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {race.description}
          </Typography>
        )}

        <KeyValueSection
          title="Details"
          items={[
            {
              label: 'Source',
              value: (
                <AppBadge
                  label={race.source}
                  tone={race.source === 'system' ? 'info' : 'default'}
                />
              ),
            },
            {
              label: 'Visibility',
              value:
                race.accessPolicy && race.accessPolicy.scope !== 'public' ? (
                  <VisibilityBadge visibility={race.accessPolicy} />
                ) : (
                  'Public'
                ),
            },
          ]}
          columns={2}
          sx={{ mt: 3 }}
        />
      </ContentDetailScaffold>

      {canPatch && campaignId && (
        <SystemContentPatchModal
          open={patchModalOpen}
          onClose={handlePatchModalClose}
          campaignId={campaignId}
          contentTypeKey="races"
          entryId={race.id}
          entryName={race.name}
          examplePatch={'{\n  "description": "Patched description..."\n}'}
        />
      )}
    </>
  );
}
