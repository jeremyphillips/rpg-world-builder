/**
 * Spell edit route.
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
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { spellRepo } from '@/features/content/domain/repo';
import { validateSpellChange } from '@/features/content/domain/validation';
import type { Spell, SpellInput } from '@/features/content/shared/domain/types/spell.types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import {
  getContentPatch,
  getEntryPatch,
  upsertEntryPatch,
  removeEntryPatch,
} from '@/features/content/shared/domain/contentPatchRepo';
import { createPatchDriver } from '@/features/content/shared/editor/patchDriver';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import {
  type SpellFormValues,
  getSpellFieldConfigs,
  SPELL_FORM_DEFAULTS,
  spellToFormValues,
  toSpellInput,
} from '@/features/spell/forms';

type ValidationError = { path: string; code: string; message: string };

const FORM_ID = 'spell-edit-form';

export default function SpellEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { spellId } = useParams<{ spellId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    spellId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner),
  );

  const { entry: spell, loading, error, notFound } = useCampaignContentEntry<Spell>({
    campaignId: campaignId ?? undefined,
    entryId: spellId,
    fetchEntry: spellRepo.getEntry,
  });

  const methods = useForm<SpellFormValues>({
    defaultValues: SPELL_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [initialPatch, setInitialPatch] = useState<Record<string, unknown>>({});
  const [, setPatchDraft] = useState<Record<string, unknown>>({});

  const isSystem = spell?.source === 'system';
  const isCampaign = spell?.source === 'campaign';

  useEffect(() => {
    if (!spell || !isCampaign) return;
    reset(spellToFormValues(spell));
  }, [spell, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !spellId || !spell || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId)
      .then((doc) => {
        if (cancelled) return;
        const existing = (getEntryPatch(doc, 'spells', spellId) ?? {}) as Record<string, unknown>;
        setInitialPatch(existing);
        setPatchDraft(existing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId, spellId, spell, isSystem]);

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
    async (values: SpellFormValues) => {
      if (!campaignId || !spellId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input: SpellInput = toSpellInput(values);
      try {
        const updated = await spellRepo.updateEntry(campaignId, spellId, input);
        reset(spellToFormValues(updated));
        setSuccess(true);
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, spellId, reset],
  );

  const driver = useMemo(() => {
    if (!spell) return null;
    return createPatchDriver({
      base: spell as unknown as Record<string, unknown>,
      initialPatch,
      onChange: (p) => {
        setPatchDraft(p);
        setSuccess(false);
      },
    });
  }, [spell, initialPatch]);

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !spellId || !driver) return;
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
      await upsertEntryPatch(campaignId, 'spells', spellId, next);
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
  }, [campaignId, spellId, driver]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !spellId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(campaignId, 'spells', spellId);
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
  }, [campaignId, spellId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !spellId) return;
    await spellRepo.deleteEntry(campaignId, spellId);
    navigate(`/campaigns/${campaignId}/world/spells`, {
      replace: true,
    });
  }, [campaignId, spellId, navigate]);

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !spellId) return { allowed: true as const };
    return validateSpellChange({ campaignId, spellId, mode: 'delete' });
  }, [campaignId, spellId]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/spells`),
    [navigate, campaignId],
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error || notFound || !spell)
    return (
      <AppAlert tone="danger">{error ?? 'Spell not found.'}</AppAlert>
    );

  const fieldConfigs = getSpellFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Spell Patch"
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
            Patching: {spell.name}
          </Typography>
          {spell.patched && (
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
        typeLabel="Spell"
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
