/**
 * Weapon edit route.
 *
 * - source === 'system': JSON patch editor via contentPatchRepo
 * - source === 'campaign': real form editor with delete support
 */
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { weaponRepo } from '@/features/content/domain/repo';
import type { Weapon, WeaponInput } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import {
  getContentPatch, getEntryPatch, upsertEntryPatch, removeEntryPatch,
} from '@/features/content/domain/contentPatchRepo';
import { JsonPreviewField } from '@/ui/patterns';
import { AppBadge } from '@/ui/primitives';
import { AppAlert } from '@/ui/primitives';

type ValidationError = { path: string; code: string; message: string };

type FormValues = {
  name: string;
  description: string;
  imageKey: string;
  accessPolicy: Visibility;
  category: string;
  mode: string;
  damageDefault: string;
  damageType: string;
  mastery: string;
  propertiesJson: string;
};

const FORM_ID = 'weapon-edit-form';

export default function WeaponEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { weaponId } = useParams<{ weaponId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(weaponId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner));

  const { entry: weapon, loading, error, notFound } = useCampaignContentEntry<Weapon>({
    campaignId: campaignId ?? undefined,
    entryId: weaponId,
    fetchEntry: weaponRepo.getEntry,
  });

  // ── Campaign editor state ───────────────────────────────────────
  const methods = useForm<FormValues>({
    defaultValues: { name: '', description: '', imageKey: '', accessPolicy: DEFAULT_VISIBILITY_PUBLIC, category: 'simple', mode: 'melee', damageDefault: '', damageType: '', mastery: '', propertiesJson: '[]' },
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // ── System patch editor state ───────────────────────────────────
  const [patchText, setPatchText] = useState('');
  const [initialPatchText, setInitialPatchText] = useState('');
  const [patchSaveError, setPatchSaveError] = useState<string | null>(null);

  const isSystem = weapon?.source === 'system';
  const isCampaign = weapon?.source === 'campaign';

  useEffect(() => {
    if (!weapon || !isCampaign) return;
    reset({
      name: weapon.name,
      description: weapon.description ?? '',
      imageKey: weapon.imageKey ?? '',
      accessPolicy: weapon.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
      category: weapon.category ?? 'simple',
      mode: weapon.mode ?? 'melee',
      damageDefault: weapon.damage?.default ?? '',
      damageType: weapon.damageType ?? '',
      mastery: weapon.mastery ?? '',
      propertiesJson: JSON.stringify(weapon.properties ?? [], null, 2),
    });
  }, [weapon, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !weaponId || !weapon || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId).then(doc => {
      if (cancelled) return;
      const existing = getEntryPatch(doc, 'weapons', weaponId);
      if (existing) {
        const text = JSON.stringify(existing, null, 2);
        setPatchText(text);
        setInitialPatchText(text);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [campaignId, weaponId, weapon, isSystem]);

  useEffect(() => {
    const sub = watch(() => { setSuccess(false); setErrors([]); });
    return () => sub.unsubscribe();
  }, [watch]);

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback((next: Visibility) => {
    setValue('accessPolicy', next, { shouldDirty: true });
  }, [setValue]);

  // ── Campaign submit ─────────────────────────────────────────────
  const handleCampaignSubmit = useCallback(async (values: FormValues) => {
    if (!campaignId || !weaponId) return;
    setSaving(true); setSuccess(false); setErrors([]);
    let properties: string[] = [];
    try { properties = JSON.parse(values.propertiesJson); } catch { /* keep empty */ }
    const input: WeaponInput = {
      name: values.name.trim(), description: values.description.trim(),
      accessPolicy: values.accessPolicy,
      category: values.category as WeaponInput['category'],
      mode: values.mode as WeaponInput['mode'],
      damage: { default: values.damageDefault }, damageType: values.damageType,
      mastery: values.mastery, properties,
    };
    try {
      const updated = await weaponRepo.updateEntry(campaignId, weaponId, input);
      reset({
        name: updated.name, description: updated.description ?? '',
        imageKey: updated.imageKey ?? '',
        accessPolicy: updated.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
        category: updated.category ?? 'simple', mode: updated.mode ?? 'melee',
        damageDefault: updated.damage?.default ?? '', damageType: updated.damageType ?? '',
        mastery: updated.mastery ?? '', propertiesJson: JSON.stringify(updated.properties ?? [], null, 2),
      });
      setSuccess(true);
    } catch (err) {
      setErrors([{ path: '', code: 'SAVE_FAILED', message: (err as Error).message }]);
    } finally { setSaving(false); }
  }, [campaignId, weaponId, reset]);

  // ── System patch save ───────────────────────────────────────────
  const patchDirty = patchText !== initialPatchText;
  const tryParse = useCallback((t: string) => {
    const s = t.trim(); if (!s) return { valid: true, value: {} };
    try { return { valid: true, value: JSON.parse(s) }; } catch { return { valid: false, value: null }; }
  }, []);
  const parsed = tryParse(patchText);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !weaponId || !parsed.valid) return;
    setSaving(true); setPatchSaveError(null);
    try {
      await upsertEntryPatch(campaignId, 'weapons', weaponId, parsed.value);
      setInitialPatchText(patchText); setSuccess(true);
    } catch (err) { setPatchSaveError((err as Error).message); }
    finally { setSaving(false); }
  }, [campaignId, weaponId, parsed, patchText]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !weaponId) return;
    setSaving(true);
    try { await removeEntryPatch(campaignId, 'weapons', weaponId); setPatchText(''); setInitialPatchText(''); setSuccess(true); }
    catch (err) { setPatchSaveError((err as Error).message); }
    finally { setSaving(false); }
  }, [campaignId, weaponId]);

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!campaignId || !weaponId) return;
    await weaponRepo.deleteEntry(campaignId, weaponId);
    navigate(`/campaigns/${campaignId}/world/equipment/weapons`, { replace: true });
  }, [campaignId, weaponId, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/weapons`);
  }, [navigate, campaignId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error || notFound || !weapon) return <AppAlert tone="danger">{error ?? 'Weapon not found.'}</AppAlert>;

  // ── System patch UI ─────────────────────────────────────────────
  if (isSystem) {
    return (
      <EntryEditorLayout typeLabel="Weapon Patch" isNew={false} saving={saving} dirty={patchDirty} success={success}
        errors={patchSaveError ? [{ path: '', code: 'SAVE_FAILED', message: patchSaveError }] : []}
        onSave={handlePatchSave} onBack={handleBack}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>Patching: {weapon.name}</Typography>
          {weapon.patched && <AppBadge label="Patched" tone="warning" size="small" />}
          <Typography variant="body2" color="text.secondary">
            Enter a JSON object to deep-merge into this system weapon for your campaign.
          </Typography>
          <JsonPreviewField label="Patch JSON" value={patchText}
            onChange={v => { setPatchText(v); setSuccess(false); setPatchSaveError(null); }}
            placeholder={'{\n  "description": "Custom description...",\n  "damage": { "default": "2d6" }\n}'}
            minRows={8} maxRows={20} />
          {initialPatchText && (
            <Button variant="outlined" color="error" size="small" onClick={handleRemovePatch} disabled={saving} sx={{ alignSelf: 'flex-start' }}>
              Remove patch
            </Button>
          )}
        </Stack>
      </EntryEditorLayout>
    );
  }

  // ── Campaign editor UI ──────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <EntryEditorLayout typeLabel="Weapon" isNew={false} saving={saving} dirty={isDirty} success={success}
        errors={errors} formId={FORM_ID} onBack={handleBack}
        canDelete={canDelete} onDelete={handleDelete}
        validateDelete={async () => ({ allowed: true as const })}
        showPolicyField policyValue={policyValue} onPolicyChange={handlePolicyChange} policyCharacters={policyCharacters}>
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleCampaignSubmit)} noValidate>
          <Stack spacing={2.5}>
            <Controller name="name" control={methods.control} render={({ field }) => (
              <TextField {...field} label="Name" size="small" fullWidth required />
            )} />
            <Controller name="description" control={methods.control} render={({ field }) => (
              <TextField {...field} label="Description" size="small" fullWidth multiline minRows={3} maxRows={8} />
            )} />
            <Controller name="imageKey" control={methods.control} render={({ field }) => (
              <TextField {...field} label="Image Key" size="small" fullWidth helperText="/assets/... or CDN key" />
            )} />
            <Stack direction="row" spacing={2}>
              <Controller name="category" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Category" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="simple">Simple</option><option value="martial">Martial</option>
                </TextField>
              )} />
              <Controller name="mode" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Mode" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="melee">Melee</option><option value="ranged">Ranged</option>
                </TextField>
              )} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Controller name="damageDefault" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Damage" size="small" fullWidth />
              )} />
              <Controller name="damageType" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Damage Type" size="small" fullWidth />
              )} />
              <Controller name="mastery" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Mastery" size="small" fullWidth />
              )} />
            </Stack>
            <Controller name="propertiesJson" control={methods.control} render={({ field }) => (
              <JsonPreviewField label="Properties (JSON array)" value={field.value} onChange={field.onChange}
                placeholder='["light", "finesse"]' minRows={2} maxRows={4} />
            )} />
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
