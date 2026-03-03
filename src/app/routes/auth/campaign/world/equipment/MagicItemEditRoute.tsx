/**
 * Magic Item edit route.
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

import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { magicItemRepo } from '@/features/content/domain/repo';
import type { MagicItem, MagicItemInput } from '@/features/content/domain/types';
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
  type MagicItemFormValues,
  getMagicItemFieldConfigs,
  MAGIC_ITEM_FORM_DEFAULTS,
  magicItemToFormValues,
  toMagicItemInput,
} from '@/features/equipment/magicItems/forms';

type ValidationError = { path: string; code: string; message: string };

const FORM_ID = 'magic-item-edit-form';

export default function MagicItemEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { magicItemId } = useParams<{ magicItemId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    magicItemId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner)
  );

  const { entry: item, loading, error, notFound } = useCampaignContentEntry<MagicItem>({
    campaignId: campaignId ?? undefined,
    entryId: magicItemId,
    fetchEntry: magicItemRepo.getEntry,
  });

  const methods = useForm<MagicItemFormValues>({
    defaultValues: MAGIC_ITEM_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [initialPatch, setInitialPatch] = useState<Record<string, unknown>>({});
  const [, setPatchDraft] = useState<Record<string, unknown>>({});

  const isSystem = item?.source === 'system';
  const isCampaign = item?.source === 'campaign';

  useEffect(() => {
    if (!item || !isCampaign) return;
    reset(magicItemToFormValues(item));
  }, [item, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !magicItemId || !item || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId)
      .then((doc) => {
        if (cancelled) return;
        const existing = (getEntryPatch(doc, 'magicItems', magicItemId) ?? {}) as Record<string, unknown>;
        setInitialPatch(existing);
        setPatchDraft(existing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId, magicItemId, item, isSystem]);

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
    async (values: MagicItemFormValues) => {
      if (!campaignId || !magicItemId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input: MagicItemInput = toMagicItemInput(values);
      try {
        const updated = await magicItemRepo.updateEntry(campaignId, magicItemId, input);
        reset(magicItemToFormValues(updated));
        setSuccess(true);
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, magicItemId, reset]
  );

  const driver = useMemo(() => {
    if (!item) return null;
    return createPatchDriver({
      base: item as unknown as Record<string, unknown>,
      initialPatch,
      onChange: (p) => {
        setPatchDraft(p);
        setSuccess(false);
      },
    });
  }, [item, initialPatch]);

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !magicItemId || !driver) return;
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
      await upsertEntryPatch(campaignId, 'magicItems', magicItemId, next);
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
  }, [campaignId, magicItemId, driver]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !magicItemId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(campaignId, 'magicItems', magicItemId);
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
  }, [campaignId, magicItemId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !magicItemId) return;
    await magicItemRepo.deleteEntry(campaignId, magicItemId);
    navigate(`/campaigns/${campaignId}/world/equipment/magic-items`, {
      replace: true,
    });
  }, [campaignId, magicItemId, navigate]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/equipment/magic-items`),
    [navigate, campaignId]
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error || notFound || !item)
    return (
      <AppAlert tone="danger">{error ?? 'Magic item not found.'}</AppAlert>
    );

  const fieldConfigs = getMagicItemFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Magic Item Patch"
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
            Patching: {item.name}
          </Typography>
          {item.patched && (
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
        typeLabel="Magic Item"
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
