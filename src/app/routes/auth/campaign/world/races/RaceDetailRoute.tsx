import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { VisibilityChip } from '@/ui/components/fields';
import { raceRepo } from '@/features/content/domain/repo';
import { DEFAULT_SYSTEM_ID } from '@/features/mechanics/domain/core/rules/campaignRulesetRepo';
import type { Race } from '@/features/content/domain/types';
import { PageHeader } from '@/ui/elements';
import { useBreadcrumbs } from '@/hooks';
import { toViewerContext, canManageCampaignContent } from '@/shared/domain/capabilities';

export default function RaceDetailRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { raceId } = useParams<{ raceId: string }>();
  const breadcrumbs = useBreadcrumbs();

  const ctx = toViewerContext(campaign?.viewer);
  const canManage = canManageCampaignContent(ctx);

  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId || !raceId) return;
    let cancelled = false;

    raceRepo.getEntry(campaignId, DEFAULT_SYSTEM_ID, raceId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          setError('Race not found.');
        } else {
          setRace(loaded);
        }
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [campaignId, raceId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !race) {
    return <Alert severity="error">{error ?? 'Race not found.'}</Alert>;
  }

  const listPath = `/campaigns/${campaignId}/world/races`;
  const editPath = `${listPath}/${raceId}/edit`;

  const policyScope = race.accessPolicy?.scope;
  const isRestricted = policyScope === 'restricted' || policyScope === 'dm';

  return (
    <Box>
      <PageHeader
        headline={race.name}
        breadcrumbData={breadcrumbs}
        actions={[
          <Button
            component={Link}
            to={listPath}
            size="small"
            startIcon={<ArrowBackIcon />}
          >
          Back to list
        </Button>
        ]}
      />

      {race.source === 'system' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is a system race and is not editable.
        </Alert>
      )}

      {isRestricted && race.source === 'campaign' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This content has restricted visibility — not all campaign members can see it.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {canManage && race.source === 'campaign' && (
            <Button
              component={Link}
              to={editPath}
              variant="contained"
              size="small"
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
          )}
          {race.accessPolicy && race.accessPolicy.scope !== 'public' && (
            <VisibilityChip visibility={race.accessPolicy} />
          )}
        </Stack>
      </Stack>

      {race.description && (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {race.description}
        </Typography>
      )}
    </Box>
  );
}
