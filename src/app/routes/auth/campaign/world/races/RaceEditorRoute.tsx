import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import type { Visibility } from '@/data/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/components/fields';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { raceRepo } from '@/features/content/domain/repo';
import { validateRaceDelete } from '@/features/content/domain/validateRaceDelete';
import { DEFAULT_SYSTEM_ID } from '@/features/mechanics/domain/core/rules/campaignRulesetRepo';
import type { RaceInput } from '@/features/content/domain/types';

type ValidationError = { path: string; code: string; message: string };

export default function RaceEditorRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();

  const isNew = !raceId;
  const viewer = campaign?.viewer;

  const canDelete = Boolean(
    !isNew &&
    raceId &&
    campaignId &&
    (viewer?.isPlatformAdmin || viewer?.isOwner),
  );

  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessPolicy, setAccessPolicy] = useState<Visibility>(DEFAULT_VISIBILITY_PUBLIC);
  const [dirty, setDirty] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (isNew || !campaignId || !raceId) return;
    let cancelled = false;

    raceRepo.getEntry(campaignId, DEFAULT_SYSTEM_ID, raceId)
      .then(race => {
        if (cancelled) return;
        if (!race || race.source !== 'campaign') {
          navigate(
            `/campaigns/${campaignId}/world/races/${raceId}`,
            { replace: true },
          );
          return;
        }
        setName(race.name);
        setDescription(race.description);
        setAccessPolicy(race.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC);
        setLoading(false);
      })
      .catch(err => {
        if (!cancelled) {
          setLoadError((err as Error).message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [campaignId, raceId, isNew, navigate]);

  const markDirty = useCallback(() => {
    setDirty(true);
    setSuccess(false);
    setErrors([]);
  }, []);

  const handlePolicyChange = useCallback((next: Visibility) => {
    setAccessPolicy(next);
    markDirty();
  }, [markDirty]);

  const handleSave = useCallback(async () => {
    if (!campaignId) return;

    setSaving(true);
    setSuccess(false);
    setErrors([]);

    const input: RaceInput = {
      name: name.trim(),
      description: description.trim(),
      accessPolicy,
    };

    try {
      if (isNew) {
        const created = await raceRepo.createEntry(campaignId, DEFAULT_SYSTEM_ID, input);
        navigate(
          `/campaigns/${campaignId}/world/races/${created.id}`,
          { replace: true },
        );
      } else if (raceId) {
        const updated = await raceRepo.updateEntry(campaignId, DEFAULT_SYSTEM_ID, raceId, input);
        setName(updated.name);
        setDescription(updated.description);
        setAccessPolicy(updated.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC);
        setDirty(false);
        setSuccess(true);
      }
    } catch (err) {
      setErrors([{
        path: '',
        code: 'SAVE_FAILED',
        message: (err as Error).message,
      }]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, raceId, isNew, name, description, accessPolicy, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/races`);
  }, [navigate, campaignId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !raceId) return;
    await raceRepo.deleteEntry(campaignId, DEFAULT_SYSTEM_ID, raceId);
    navigate(`/campaigns/${campaignId}/world/races`, { replace: true });
  }, [campaignId, raceId, navigate]);

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !raceId) return { allowed: true as const };
    return validateRaceDelete(campaignId, raceId);
  }, [campaignId, raceId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  return (
    <EntryEditorLayout
      typeLabel="Race"
      isNew={isNew}
      saving={saving}
      dirty={dirty}
      success={success}
      errors={errors}
      onSave={handleSave}
      onBack={handleBack}
      canDelete={canDelete}
      onDelete={handleDelete}
      validateDelete={handleValidateDelete}
      showPolicyField
      policyValue={accessPolicy}
      onPolicyChange={handlePolicyChange}
      policyCharacters={policyCharacters}
    >
      <Stack spacing={2.5}>
        <TextField
          label="Name"
          size="small"
          fullWidth
          required
          value={name}
          onChange={e => { setName(e.target.value); markDirty(); }}
        />

        <TextField
          label="Description"
          size="small"
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          value={description}
          onChange={e => { setDescription(e.target.value); markDirty(); }}
        />
      </Stack>
    </EntryEditorLayout>
  );
}
