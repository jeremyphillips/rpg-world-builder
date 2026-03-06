/**
 * Race edit route.
 *
 * - source === 'system': field-config patch form via contentPatchRepo
 * - source === 'campaign': real form editor with delete support
 */
import { useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import type { Race } from '@/features/content/shared/domain/types';
import {
  raceRepo,
  validateRaceChange,
  type RaceFormValues,
  getRaceFieldConfigs,
  RACE_FORM_DEFAULTS,
  raceToFormValues,
  toRaceInput,
} from '@/features/content/races/domain';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import { useEditRouteFeedbackState } from '@/features/content/shared/hooks/useEditRouteFeedbackState';
import { useResetEditFeedbackOnChange } from '@/features/content/shared/hooks/useResetEditFeedbackOnChange';
import { useCampaignEntryFormReset } from '@/features/content/shared/hooks/useCampaignEntryFormReset';
import { useSystemEntryPatchState } from '@/features/content/shared/hooks/useSystemEntryPatchState';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { usePatchDriverState } from '@/features/content/shared/hooks/usePatchDriverState';
import { useCampaignEntrySubmit } from '@/features/content/shared/hooks/useCampaignEntrySubmit';
import { useSystemPatchActions } from '@/features/content/shared/hooks/useSystemPatchActions';
import { useEntryDeleteAction } from '@/features/content/shared/hooks/useEntryDeleteAction';

const FORM_ID = 'race-edit-form';

export default function RaceEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    raceId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner),
  );

  const { entry: race, loading, error, notFound } = useCampaignContentEntry<Race>({
    campaignId: campaignId ?? undefined,
    entryId: raceId,
    fetchEntry: raceRepo.getEntry,
  });

  const methods = useForm<RaceFormValues>({
    defaultValues: RACE_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;

  const {
    saving,
    success,
    errors,
    setSaving,
    setSuccess,
    setErrors,
    clearFeedback,
  } = useEditRouteFeedbackState();

  const isSystem = race?.source === 'system';
  const isCampaign = race?.source === 'campaign';

  const {
    initialPatch,
    setInitialPatch,
    hasExistingPatch,
    onPatchChange,
  } = useSystemEntryPatchState(
    campaignId ?? undefined,
    raceId,
    race,
    !!isSystem,
    'races'
  );

  useCampaignEntryFormReset(race, isCampaign ?? false, reset, raceToFormValues);
  useResetEditFeedbackOnChange(watch, clearFeedback);

  const { policyValue, handlePolicyChange } = useAccessPolicyField<RaceFormValues>(watch, setValue);

  const driver = usePatchDriverState(
    race ? (race as unknown as Record<string, unknown>) : null,
    initialPatch,
    onPatchChange,
    clearFeedback
  );

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handleCampaignSubmit = useCampaignEntrySubmit({
    campaignId: campaignId ?? undefined,
    entryId: raceId,
    updateEntry: raceRepo.updateEntry,
    reset,
    toFormValues: raceToFormValues,
    toInput: toRaceInput,
    feedback: { setSaving, setSuccess, setErrors },
  });

  const { savePatch: handlePatchSave, removePatch: handleRemovePatch } =
    useSystemPatchActions({
      campaignId: campaignId ?? undefined,
      entryId: raceId,
      collectionKey: 'races',
      driver,
      setInitialPatch,
      validationApiRef,
      feedback: { setSaving, setSuccess, setErrors },
    });

  const handleDelete = useEntryDeleteAction({
    campaignId: campaignId ?? undefined,
    entryId: raceId,
    deleteEntry: (cid, eid) => raceRepo.deleteEntry(cid, eid).then(() => {}),
    navigate,
    backPath: `/campaigns/${campaignId}/world/races`,
  });

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !raceId) return { allowed: true as const };
    return validateRaceChange({ campaignId, raceId, mode: 'delete' });
  }, [campaignId, raceId]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/races`),
    [navigate, campaignId],
  );

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

  const fieldConfigs = getRaceFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Race Patch"
        isNew={false}
        saving={saving}
        dirty={driver.isDirty()}
        success={success}
        errors={errors}
        onSave={handlePatchSave}
        onBack={handleBack}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Patching: {race.name}
          </Typography>
          {race.patched && (
            <AppBadge label="Patched" tone="warning" size="small" />
          )}
          <ConditionalFormRenderer
            fields={fieldConfigs}
            driver={{
              kind: 'patch',
              getValue: driver.getValue,
              setValue: driver.setValue,
              unsetValue: driver.unsetValue,
            }}
            onValidationApi={(api) => {
              validationApiRef.current = api;
            }}
          />
          {hasExistingPatch && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRemovePatch}
              disabled={saving}
              sx={{ alignSelf: 'flex-start' }}
            >
              Remove patch
            </Button>
          )}
        </Stack>
      </EntryEditorLayout>
    );
  }

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Race"
        isNew={false}
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
        <form
          id={FORM_ID}
          onSubmit={methods.handleSubmit(handleCampaignSubmit)}
          noValidate
        >
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
