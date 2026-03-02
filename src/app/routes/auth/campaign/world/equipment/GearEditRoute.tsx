/**
 * Gear edit route.
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
import { gearRepo } from '@/features/content/domain/repo';
import type { Gear, GearInput } from '@/features/content/domain/types';
import { useCampaignContentEntry } from '@/features/content/hooks/useCampaignContentEntry';
import {
  getContentPatch, getEntryPatch, upsertEntryPatch, removeEntryPatch,
} from '@/features/content/domain/contentPatchRepo';
import { JsonPreviewField } from '@/ui/patterns';
import { AppAlert, AppBadge } from '@/ui/primitives';

type ValidationError = { path: string; code: string; message: string };

type FormValues = {
  name: string;
  description: string;
  imageKey: string;
  accessPolicy: Visibility;
  category: string;
  capacity: string;
};

const FORM_ID = 'gear-edit-form';

export default function GearEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { gearId } = useParams<{ gearId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(gearId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner));

  const { entry: gear, loading, error, notFound } = useCampaignContentEntry<Gear>({
    campaignId: campaignId ?? undefined,
    entryId: gearId,
    fetchEntry: gearRepo.getEntry,
  });

  const methods = useForm<FormValues>({
    defaultValues: { name: '', description: '', imageKey: '', accessPolicy: DEFAULT_VISIBILITY_PUBLIC, category: 'adventuring-utility', capacity: '' },
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [patchText, setPatchText] = useState('');
  const [initialPatchText, setInitialPatchText] = useState('');
  const [patchSaveError, setPatchSaveError] = useState<string | null>(null);

  const isSystem = gear?.source === 'system';
  const isCampaign = gear?.source === 'campaign';

  useEffect(() => {
    if (!gear || !isCampaign) return;
    reset({
      name: gear.name, description: gear.description ?? '', imageKey: gear.imageKey ?? '',
      accessPolicy: gear.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
      category: gear.category ?? 'adventuring-utility', capacity: gear.capacity ?? '',
    });
  }, [gear, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !gearId || !gear || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId).then(doc => {
      if (cancelled) return;
      const existing = getEntryPatch(doc, 'gear', gearId);
      if (existing) { const t = JSON.stringify(existing, null, 2); setPatchText(t); setInitialPatchText(t); }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [campaignId, gearId, gear, isSystem]);

  useEffect(() => { const sub = watch(() => { setSuccess(false); setErrors([]); }); return () => sub.unsubscribe(); }, [watch]);

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback((next: Visibility) => setValue('accessPolicy', next, { shouldDirty: true }), [setValue]);

  const handleCampaignSubmit = useCallback(async (values: FormValues) => {
    if (!campaignId || !gearId) return;
    setSaving(true); setSuccess(false); setErrors([]);
    const input: GearInput = {
      name: values.name.trim(), description: values.description.trim(), accessPolicy: values.accessPolicy,
      category: values.category as GearInput['category'], capacity: values.capacity.trim() || undefined,
    };
    try {
      const updated = await gearRepo.updateEntry(campaignId, gearId, input);
      reset({
        name: updated.name, description: updated.description ?? '', imageKey: updated.imageKey ?? '',
        accessPolicy: updated.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
        category: updated.category ?? 'adventuring-utility', capacity: updated.capacity ?? '',
      });
      setSuccess(true);
    } catch (err) { setErrors([{ path: '', code: 'SAVE_FAILED', message: (err as Error).message }]); }
    finally { setSaving(false); }
  }, [campaignId, gearId, reset]);

  const patchDirty = patchText !== initialPatchText;
  const tryParse = useCallback((t: string) => { const s = t.trim(); if (!s) return { valid: true, value: {} }; try { return { valid: true, value: JSON.parse(s) }; } catch { return { valid: false, value: null }; } }, []);
  const parsed = tryParse(patchText);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !gearId || !parsed.valid) return;
    setSaving(true); setPatchSaveError(null);
    try { await upsertEntryPatch(campaignId, 'gear', gearId, parsed.value); setInitialPatchText(patchText); setSuccess(true); }
    catch (err) { setPatchSaveError((err as Error).message); } finally { setSaving(false); }
  }, [campaignId, gearId, parsed, patchText]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !gearId) return; setSaving(true);
    try { await removeEntryPatch(campaignId, 'gear', gearId); setPatchText(''); setInitialPatchText(''); setSuccess(true); }
    catch (err) { setPatchSaveError((err as Error).message); } finally { setSaving(false); }
  }, [campaignId, gearId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !gearId) return;
    await gearRepo.deleteEntry(campaignId, gearId);
    navigate(`/campaigns/${campaignId}/world/equipment/gear`, { replace: true });
  }, [campaignId, gearId, navigate]);

  const handleBack = useCallback(() => navigate(`/campaigns/${campaignId}/world/equipment/gear`), [navigate, campaignId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error || notFound || !gear) return <AppAlert tone="danger">{error ?? 'Gear not found.'}</AppAlert>;

  if (isSystem) {
    return (
      <EntryEditorLayout typeLabel="Gear Patch" isNew={false} saving={saving} dirty={patchDirty} success={success}
        errors={patchSaveError ? [{ path: '', code: 'SAVE_FAILED', message: patchSaveError }] : []} onSave={handlePatchSave} onBack={handleBack}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>Patching: {gear.name}</Typography>
          {gear.patched && <AppBadge label="Patched" tone="warning" size="small" />}
          <Typography variant="body2" color="text.secondary">Enter a JSON object to deep-merge into this system gear for your campaign.</Typography>
          <JsonPreviewField label="Patch JSON" value={patchText}
            onChange={v => { setPatchText(v); setSuccess(false); setPatchSaveError(null); }}
            placeholder={'{\n  "description": "Custom description...",\n  "cost": { "coin": "gp", "value": 10 }\n}'} minRows={8} maxRows={20} />
          {initialPatchText && <Button variant="outlined" color="error" size="small" onClick={handleRemovePatch} disabled={saving} sx={{ alignSelf: 'flex-start' }}>Remove patch</Button>}
        </Stack>
      </EntryEditorLayout>
    );
  }

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout typeLabel="Gear" isNew={false} saving={saving} dirty={isDirty} success={success}
        errors={errors} formId={FORM_ID} onBack={handleBack} canDelete={canDelete} onDelete={handleDelete}
        validateDelete={async () => ({ allowed: true as const })}
        showPolicyField policyValue={policyValue} onPolicyChange={handlePolicyChange} policyCharacters={policyCharacters}>
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleCampaignSubmit)} noValidate>
          <Stack spacing={2.5}>
            <Controller name="name" control={methods.control} render={({ field }) => <TextField {...field} label="Name" size="small" fullWidth required />} />
            <Controller name="description" control={methods.control} render={({ field }) => <TextField {...field} label="Description" size="small" fullWidth multiline minRows={3} maxRows={8} />} />
            <Controller name="imageKey" control={methods.control} render={({ field }) => <TextField {...field} label="Image Key" size="small" fullWidth helperText="/assets/... or CDN key" />} />
            <Controller name="category" control={methods.control} render={({ field }) => <TextField {...field} label="Category" size="small" fullWidth />} />
            <Controller name="capacity" control={methods.control} render={({ field }) => <TextField {...field} label="Capacity / Notes" size="small" fullWidth />} />
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
