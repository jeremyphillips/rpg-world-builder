/**
 * Weapon edit route.
 *
 * - source === 'system': field-config patch form via contentPatchRepo
 * - source === 'campaign': real form editor with delete support
 *
 * Uses domain patch shape end-to-end. Field bindings (patchBinding) adapt
 * flattened UI fields (damageDefaultCount/die, rangeNormal/Long) to domain
 * paths (damage.default, range.normal, etc.). No route-level patch conversion.
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
import { weaponRepo } from '@/features/content/domain/repo';
import { validateWeaponChange } from '@/features/content/domain/validation';
import type { Weapon, WeaponInput } from '@/features/content/shared/domain/types';
import { useCampaignContentEntry } from '@/features/content/shared/hooks/useCampaignContentEntry';
import {
  upsertEntryPatch,
  removeEntryPatch,
} from '@/features/content/shared/domain/contentPatchRepo';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';
import {
  type WeaponFormValues,
  getWeaponFieldConfigs,
  WEAPON_FORM_DEFAULTS,
  weaponToFormValues,
  toWeaponInput,
} from '@/features/content/equipment/weapons/domain';
import { useEditRouteFeedbackState } from '@/features/content/shared/hooks/useEditRouteFeedbackState';
import { useResetEditFeedbackOnChange } from '@/features/content/shared/hooks/useResetEditFeedbackOnChange';
import { useCampaignEntryFormReset } from '@/features/content/shared/hooks/useCampaignEntryFormReset';
import { useSystemEntryPatchState } from '@/features/content/shared/hooks/useSystemEntryPatchState';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { usePatchDriverState } from '@/features/content/shared/hooks/usePatchDriverState';

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

  const {
    saving,
    success,
    errors,
    setSaving,
    setSuccess,
    setErrors,
    clearFeedback,
  } = useEditRouteFeedbackState();

  const isSystem = weapon?.source === 'system';
  const isCampaign = weapon?.source === 'campaign';

  const {
    initialPatch,
    setInitialPatch,
    hasExistingPatch,
    onPatchChange,
  } = useSystemEntryPatchState(
    campaignId ?? undefined,
    weaponId,
    weapon,
    !!isSystem,
    'weapons'
  );

  useCampaignEntryFormReset(weapon, isCampaign ?? false, reset, weaponToFormValues);
  useResetEditFeedbackOnChange(watch, clearFeedback);

  const { policyValue, handlePolicyChange } = useAccessPolicyField<WeaponFormValues>(watch, setValue);

  const driver = usePatchDriverState(
    weapon ? (weapon as unknown as Record<string, unknown>) : null,
    initialPatch,
    onPatchChange,
    clearFeedback
  );

  const validationApiRef = useRef<{ validateAll: () => boolean } | null>(null);

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
    [campaignId, weaponId, reset, setSaving, setSuccess, setErrors]
  );

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
    try {
      await upsertEntryPatch(campaignId, 'weapons', weaponId, next);
      setInitialPatch(next);
      setSuccess(true);
    } catch (err) {
      setErrors([
        { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
      ]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, weaponId, driver, setSaving, setSuccess, setErrors, setInitialPatch]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !weaponId) return;
    setSaving(true);
    setSuccess(false);
    setErrors([]);
    try {
      await removeEntryPatch(campaignId, 'weapons', weaponId);
      setInitialPatch({});
      setSuccess(true);
    } catch (err) {
      setErrors([
        { path: '', code: 'REMOVE_FAILED', message: (err as Error).message },
      ]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, weaponId, setSaving, setSuccess, setErrors, setInitialPatch]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !weaponId) return;
    await weaponRepo.deleteEntry(campaignId, weaponId);
    navigate(`/campaigns/${campaignId}/world/equipment/weapons`, {
      replace: true,
    });
  }, [campaignId, weaponId, navigate]);

  const handleValidateDelete = useCallback(async () => {
    if (!campaignId || !weaponId) return { allowed: true as const };
    return validateWeaponChange({ campaignId, weaponId, mode: 'delete' });
  }, [campaignId, weaponId]);

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
