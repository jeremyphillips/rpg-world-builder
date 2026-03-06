/**
 * Skill proficiency edit route.
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
import { skillProficiencyRepo } from '@/features/content/domain/repo';
import { validateSkillProficiencyChange } from '@/features/content/domain/validation';
import type { SkillProficiency } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import {
  type SkillProficiencyFormValues,
  getSkillProficiencyFieldConfigs,
  SKILL_PROFICIENCY_FORM_DEFAULTS,
  skillProficiencyToFormValues,
  toSkillProficiencyInput,
} from '@/features/content/skillProficiencies/domain';
import { useEditRouteFeedbackState } from '@/features/content/shared/hooks/useEditRouteFeedbackState';
import { useResetEditFeedbackOnChange } from '@/features/content/shared/hooks/useResetEditFeedbackOnChange';
import { useCampaignEntryFormReset } from '@/features/content/shared/hooks/useCampaignEntryFormReset';
import { useSystemEntryPatchState } from '@/features/content/shared/hooks/useSystemEntryPatchState';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { usePatchDriverState } from '@/features/content/shared/hooks/usePatchDriverState';
import { useCampaignEntrySubmit } from '@/features/content/shared/hooks/useCampaignEntrySubmit';
import { useSystemPatchActions } from '@/features/content/shared/hooks/useSystemPatchActions';
import { useEntryDeleteAction } from '@/features/content/shared/hooks/useEntryDeleteAction';

const FORM_ID = 'skill-proficiency-edit-form';

export default function SkillProficiencyEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { skillProficiencyId } = useParams<{ skillProficiencyId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    skillProficiencyId &&
      campaignId &&
      (viewer?.isPlatformAdmin || viewer?.isOwner),
  );

  const { entry: skillProficiency, loading, error, notFound } =
    useCampaignContentEntry<SkillProficiency>({
      campaignId: campaignId ?? undefined,
      entryId: skillProficiencyId,
      fetchEntry: skillProficiencyRepo.getEntry,
    });

  const methods = useForm<SkillProficiencyFormValues>({
    defaultValues: SKILL_PROFICIENCY_FORM_DEFAULTS,
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

  const isSystem = skillProficiency?.source === 'system';
  const isCampaign = skillProficiency?.source === 'campaign';

  const {
    initialPatch,
    setInitialPatch,
    hasExistingPatch,
    onPatchChange,
  } = useSystemEntryPatchState(
    campaignId ?? undefined,
    skillProficiencyId,
    skillProficiency,
    !!isSystem,
    'skillProficiencies'
  );

  useCampaignEntryFormReset(
    skillProficiency,
    isCampaign ?? false,
    reset,
    skillProficiencyToFormValues
  );
  useResetEditFeedbackOnChange(watch, clearFeedback);

  const { policyValue, handlePolicyChange } = useAccessPolicyField<SkillProficiencyFormValues>(
    watch,
    setValue
  );

  const driver = usePatchDriverState(
    skillProficiency
      ? (skillProficiency as unknown as Record<string, unknown>)
      : null,
    initialPatch,
    onPatchChange,
    clearFeedback
  );

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handleCampaignSubmit = useCampaignEntrySubmit({
    campaignId: campaignId ?? undefined,
    entryId: skillProficiencyId,
    updateEntry: skillProficiencyRepo.updateEntry,
    reset,
    toFormValues: skillProficiencyToFormValues,
    toInput: toSkillProficiencyInput,
    feedback: { setSaving, setSuccess, setErrors },
  });

  const { savePatch: handlePatchSave, removePatch: handleRemovePatch } =
    useSystemPatchActions({
      campaignId: campaignId ?? undefined,
      entryId: skillProficiencyId,
      collectionKey: 'skillProficiencies',
      driver,
      setInitialPatch,
      validationApiRef,
      feedback: { setSaving, setSuccess, setErrors },
    });

  const handleDelete = useEntryDeleteAction({
    campaignId: campaignId ?? undefined,
    entryId: skillProficiencyId,
    deleteEntry: (cid, eid) =>
      skillProficiencyRepo.deleteEntry(cid, eid).then(() => {}),
    navigate,
    backPath: `/campaigns/${campaignId}/world/skill-proficiencies`,
  });

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !skillProficiencyId) return { allowed: true as const };
    return validateSkillProficiencyChange({
      campaignId,
      skillProficiencyId,
      mode: 'delete',
    });
  }, [campaignId, skillProficiencyId]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/skill-proficiencies`),
    [navigate, campaignId],
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error || notFound || !skillProficiency)
    return (
      <AppAlert tone="danger">
        {error ?? 'Skill proficiency not found.'}
      </AppAlert>
    );

  const fieldConfigs = getSkillProficiencyFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Skill Proficiency Patch"
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
            Patching: {skillProficiency.name}
          </Typography>
          {skillProficiency.patched && (
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
        typeLabel="Skill Proficiency"
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
