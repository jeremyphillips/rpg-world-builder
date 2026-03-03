/**
 * Weapon edit route.
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
import { weaponRepo } from '@/features/content/domain/repo';
import type { Weapon, WeaponInput } from '@/features/content/domain/types';
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
  type WeaponFormValues,
  getWeaponFieldConfigs,
  WEAPON_FORM_DEFAULTS,
  weaponToFormValues,
  toWeaponInput,
  weaponDomainPatchToForm,
  weaponPatchToDomain,
} from '@/features/equipment/weapons/forms';

type ValidationError = { path: string; code: string; message: string };

const FORM_ID = 'weapon-edit-form';

export default function WeaponEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { weaponId } = useParams<{ weaponId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(
    weaponId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner)
  );

  const { entry: weapon, loading, error, notFound } =
    useCampaignContentEntry<Weapon>({
      campaignId: campaignId ?? undefined,
      entryId: weaponId,
      fetchEntry: weaponRepo.getEntry,
    });

  const methods = useForm<WeaponFormValues>({
    defaultValues: WEAPON_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [initialPatch, setInitialPatch] = useState<Record<string, unknown>>({});
  const [, setPatchDraft] = useState<Record<string, unknown>>({});

  const isSystem = weapon?.source === 'system';
  const isCampaign = weapon?.source === 'campaign';

  useEffect(() => {
    if (!weapon || !isCampaign) return;
    reset(weaponToFormValues(weapon));
  }, [weapon, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !weaponId || !weapon || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId)
      .then((doc) => {
        if (cancelled) return;
        const existing = (getEntryPatch(doc, 'weapons', weaponId) ?? {}) as Record<string, unknown>;
        setInitialPatch(existing);
        setPatchDraft(existing);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignId, weaponId, weapon, isSystem]);

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
    async (values: WeaponFormValues) => {
      if (!campaignId || !weaponId) return;
      setSaving(true);
      setSuccess(false);
      setErrors([]);
      const input: WeaponInput = toWeaponInput(values);
      try {
        const updated = await weaponRepo.updateEntry(campaignId, weaponId, input);
        reset(weaponToFormValues(updated));
        setSuccess(true);
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, weaponId, reset]
  );

  const driver = useMemo(() => {
    if (!weapon) return null;
    const baseWithFormValues = {
      ...weapon,
      ...weaponToFormValues(weapon),
    } as unknown as Record<string, unknown>;
    const formStylePatch = weaponDomainPatchToForm(initialPatch);
    return createPatchDriver({
      base: baseWithFormValues,
      initialPatch: formStylePatch,
      onChange: (p) => {
        setPatchDraft(p);
        setSuccess(false);
      },
    });
  }, [weapon, initialPatch]);

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !weaponId || !driver) return;
    const ok = validationApiRef.current?.validateAll?.() ?? true;
    if (!ok) {
      setSuccess(false);
      return;
    }
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    const next = driver.getPatch();
    const domainPatch = weaponPatchToDomain(next);
    try {
      await upsertEntryPatch(campaignId, 'weapons', weaponId, domainPatch);
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
  }, [campaignId, weaponId, driver]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !weaponId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(campaignId, 'weapons', weaponId);
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
  }, [campaignId, weaponId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !weaponId) return;
    await weaponRepo.deleteEntry(campaignId, weaponId);
    navigate(`/campaigns/${campaignId}/world/equipment/weapons`, {
      replace: true,
    });
  }, [campaignId, weaponId, navigate]);

  const handleBack = useCallback(
    () => navigate(`/campaigns/${campaignId}/world/equipment/weapons`),
    [navigate, campaignId]
  );

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  if (error || notFound || !weapon)
    return (
      <AppAlert tone="danger">{error ?? 'Weapon not found.'}</AppAlert>
    );

  const fieldConfigs = getWeaponFieldConfigs({ policyCharacters });

  if (isSystem && driver) {
    return (
      <EntryEditorLayout
        typeLabel="Weapon Patch"
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
            Patching: {weapon.name}
          </Typography>
          {weapon.patched && (
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
        typeLabel="Weapon"
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
