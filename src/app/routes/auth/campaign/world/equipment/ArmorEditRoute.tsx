/**
 * Armor edit route.
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
import { armorRepo } from '@/features/content/domain/repo';
import type { Armor, ArmorInput } from '@/features/content/domain/types';
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
  type ArmorFormValues,
  getArmorFieldConfigs,
  ARMOR_FORM_DEFAULTS,
  armorToFormValues,
  toArmorInput,
} from '@/features/equipment/armor/forms';

type ValidationError = { path: string; code: string; message: string };

const FORM_ID = 'armor-edit-form';

export default function ArmorEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { armorId } = useParams<{ armorId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    armorId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner)
  );

  const { entry: armor, loading, error, notFound } = useCampaignContentEntry<Armor>({
    campaignId: campaignId ?? undefined,
    entryId: armorId,
    fetchEntry: armorRepo.getEntry,
  });

  const methods = useForm<ArmorFormValues>({
    defaultValues: ARMOR_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [initialPatch, setInitialPatch] = useState<Record<string, unknown>>({});
  const [, setPatchDraft] = useState<Record<string, unknown>>({});

  const isSystem = armor?.source === 'system';
  const isCampaign = armor?.source === 'campaign';

  useEffect(() => {
    if (!armor || !isCampaign) return;
    reset(armorToFormValues(armor));
  }, [armor, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !armorId || !armor || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId)
      .then((doc) => {
        if (cancelled) return;
        const existing = (getEntryPatch(doc, 'armor', armorId) ?? {}) as Record<string, unknown>;
        setInitialPatch(existing);
        setPatchDraft(existing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId, armorId, armor, isSystem]);

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
    [setValue]
  );

  const handleCampaignSubmit = useCallback(
    async (values: ArmorFormValues) => {
      if (!campaignId || !armorId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input: ArmorInput = toArmorInput(values);
      try {
        const updated = await armorRepo.updateEntry(campaignId, armorId, input);
        reset(armorToFormValues(updated));
        setSuccess(true);
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, armorId, reset]
  );

  const driver = useMemo(() => {
    if (!armor) return null;
    return createPatchDriver({
      base: armor as unknown as Record<string, unknown>,
      initialPatch,
      onChange: (p) => {
        setPatchDraft(p);
        setSuccess(false);
      },
    });
  }, [armor, initialPatch]);

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !armorId || !driver) return;
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
      await upsertEntryPatch(campaignId, 'armor', armorId, next);
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
  }, [campaignId, armorId, driver]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !armorId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(campaignId, 'armor', armorId);
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
  }, [campaignId, armorId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !armorId) return;
    await armorRepo.deleteEntry(campaignId, armorId);
    navigate(`/campaigns/${campaignId}/world/equipment/armor`, {
      replace: true,
    });
  }, [campaignId, armorId, navigate]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/equipment/armor`),
    [navigate, campaignId]
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error || notFound || !armor)
    return (
      <AppAlert tone="danger">{error ?? 'Armor not found.'}</AppAlert>
    );

  const fieldConfigs = getArmorFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Armor Patch"
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
            Patching: {armor.name}
          </Typography>
          {armor.patched && (
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
        typeLabel="Armor"
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
