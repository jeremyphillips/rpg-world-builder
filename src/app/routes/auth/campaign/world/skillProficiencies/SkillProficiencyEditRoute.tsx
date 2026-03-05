/**
 * Skill proficiency edit route.
 *
 * - source === 'system': field-config patch form via contentPatchRepo
 * - source === 'campaign': real form editor with delete support
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Visibility } from '@/shared/types/visibility';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { skillProficiencyRepo } from '@/features/content/domain/repo';
import type { SkillProficiency, SkillProficiencyInput } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import {
  getContentPatch,
  getEntryPatch,
  upsertEntryPatch,
  removeEntryPatch,
} from '@/features/content/domain/contentPatchRepo';
import { createPatchDriver } from '@/features/content/editor/patchDriver';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import {
  type SkillProficiencyFormValues,
  getSkillProficiencyFieldConfigs,
  SKILL_PROFICIENCY_FORM_DEFAULTS,
  skillProficiencyToFormValues,
  toSkillProficiencyInput,
} from '@/features/skillProficiency/forms';

type ValidationError = { path: string; code: string; message: string };

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
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [initialPatch, setInitialPatch] = useState<Record<string, unknown>>({});
  const [, setPatchDraft] = useState<Record<string, unknown>>({});

  const isSystem = skillProficiency?.source === 'system';
  const isCampaign = skillProficiency?.source === 'campaign';

  useEffect(() => {
    if (!skillProficiency || !isCampaign) return;
    reset(skillProficiencyToFormValues(skillProficiency));
  }, [skillProficiency, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !skillProficiencyId || !skillProficiency || !isSystem)
      return;
    let cancelled = false;
    getContentPatch(campaignId)
      .then((doc) => {
        if (cancelled) return;
        const existing = (getEntryPatch(
          doc,
          'skillProficiencies',
          skillProficiencyId,
        ) ?? {}) as Record<string, unknown>;
        setInitialPatch(existing);
        setPatchDraft(existing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId, skillProficiencyId, skillProficiency, isSystem]);

  useEffect(() => {
    const sub = watch(() => {
      setSuccess(false);
      setErrors([]);
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback(
    (next: Visibility) => setValue('accessPolicy', next, { shouldDirty: true }),
    [setValue],
  );

  const handleCampaignSubmit = useCallback(
    async (values: SkillProficiencyFormValues) => {
      if (!campaignId || !skillProficiencyId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input: SkillProficiencyInput = toSkillProficiencyInput(values);
      try {
        const updated = await skillProficiencyRepo.updateEntry(
          campaignId,
          skillProficiencyId,
          input,
        );
        reset(skillProficiencyToFormValues(updated));
        setSuccess(true);
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, skillProficiencyId, reset],
  );

  const driver = useMemo(() => {
    if (!skillProficiency) return null;
    return createPatchDriver({
      base: skillProficiency as unknown as Record<string, unknown>,
      initialPatch,
      onChange: (p) => {
        setPatchDraft(p);
        setSuccess(false);
      },
    });
  }, [skillProficiency, initialPatch]);

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !skillProficiencyId || !driver) return;
    const ok = validationApiRef.current?.validateAll?.() ?? true;
    if (!ok) {
      setSuccess(false);
      return;
    }
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    const next = driver.getPatch();
    try {
      await upsertEntryPatch(
        campaignId,
        'skillProficiencies',
        skillProficiencyId,
        next,
      );
      setInitialPatch(next);
      setPatchDraft(next);
      setSuccess(true);
    } catch (err) {
      setErrors([
        { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
      ]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, skillProficiencyId, driver]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !skillProficiencyId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(
        campaignId,
        'skillProficiencies',
        skillProficiencyId,
      );
      setInitialPatch({});
      setPatchDraft({});
      setSuccess(true);
    } catch (err) {
      setErrors([
        { path: '', code: 'REMOVE_FAILED', message: (err as Error).message },
      ]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, skillProficiencyId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !skillProficiencyId) return;
    await skillProficiencyRepo.deleteEntry(campaignId, skillProficiencyId);
    navigate(`/campaigns/${campaignId}/world/skill-proficiencies`, {
      replace: true,
    });
  }, [campaignId, skillProficiencyId, navigate]);

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
          {Object.keys(initialPatch).length > 0 && (
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
        validateDelete={async () => ({ allowed: true as const })}
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
