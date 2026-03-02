import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { raceRepo } from '@/features/content/domain/repo';
import { validateRaceDelete } from '@/features/content/domain/validateRaceDelete';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules';
import type { RaceInput } from '@/features/content/domain/types';
import { AppAlert } from '@/ui/primitives';

type ValidationError = { path: string; code: string; message: string };

type RaceEditorFormValues = {
  name: string;
  description: string;
  accessPolicy: Visibility;
};

const FORM_ID = 'race-editor-form';

const DEFAULT_VALUES: RaceEditorFormValues = {
  name: '',
  description: '',
  accessPolicy: DEFAULT_VISIBILITY_PUBLIC,
};

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

  const methods = useForm<RaceEditorFormValues>({ defaultValues: DEFAULT_VALUES });
  const { reset, setValue, watch, formState: { isDirty } } = methods;

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    const sub = watch(() => {
      setSuccess(false);
      setErrors([]);
    });
    return () => sub.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (isNew || !campaignId || !raceId) return;
    let cancelled = false;

    raceRepo.getEntry(campaignId, DEFAULT_SYSTEM_RULESET_ID, raceId)
      .then(race => {
        if (cancelled) return;
        if (!race || race.source !== 'campaign') {
          navigate(
            `/campaigns/${campaignId}/world/races/${raceId}`,
            { replace: true },
          );
          return;
        }
        reset({
          name: race.name,
          description: race.description ?? '',
          accessPolicy: race.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
        });
        setLoading(false);
      })
      .catch(err => {
        if (!cancelled) {
          setLoadError((err as Error).message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [campaignId, raceId, isNew, navigate, reset]);

  const policyValue = watch('accessPolicy');

  const handlePolicyChange = useCallback((next: Visibility) => {
    setValue('accessPolicy', next, { shouldDirty: true });
  }, [setValue]);

  const handleSubmit = useCallback(async (values: RaceEditorFormValues) => {
    if (!campaignId) return;

    setSaving(true);
    setSuccess(false);
    setErrors([]);

    const input: RaceInput = {
      name: values.name.trim(),
      description: values.description.trim(),
      accessPolicy: values.accessPolicy,
    };

    try {
      if (isNew) {
        const created = await raceRepo.createEntry(campaignId, input);
        navigate(
          `/campaigns/${campaignId}/world/races/${created.id}`,
          { replace: true },
        );
      } else if (raceId) {
        const updated = await raceRepo.updateEntry(campaignId, raceId, input);
        reset({
          name: updated.name,
          description: updated.description ?? '',
          accessPolicy: updated.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
        });
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
  }, [campaignId, raceId, isNew, navigate, reset]);

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/races`);
  }, [navigate, campaignId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !raceId) return;
    await raceRepo.deleteEntry(campaignId, raceId);
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
    return <Box sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}><AppAlert tone="danger">{loadError}</AppAlert></Box>;
  }

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Race"
        isNew={isNew}
        saving={saving}
        dirty={isDirty}
        success={success}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        canDelete={canDelete}
        onDelete={handleDelete}
        validateDelete={handleValidateDelete}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleSubmit)} noValidate>
          <Stack spacing={2.5}>
            <Controller
              name="name"
              control={methods.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Name"
                  size="small"
                  fullWidth
                  required
                />
              )}
            />

            <Controller
              name="description"
              control={methods.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={8}
                />
              )}
            />
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
