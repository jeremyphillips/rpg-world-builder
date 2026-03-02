/**
 * Magic Item edit route.
 *
 * - source === 'system': JSON patch editor via contentPatchRepo
 * - source === 'campaign': real form editor with delete support
 */
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { magicItemRepo } from '@/features/content/domain/repo';
import type { MagicItem, MagicItemInput } from '@/features/content/domain/types';
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
  slot: string;
  rarity: string;
  requiresAttunement: boolean;
  effectsJson: string;
};

const FORM_ID = 'magic-item-edit-form';

export default function MagicItemEditRoute() {
  const { campaignId, campaign } = useActiveCampaign();
  const { magicItemId } = useParams<{ magicItemId: string }>();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const viewer = campaign?.viewer;
  const canDelete = Boolean(magicItemId && campaignId && (viewer?.isPlatformAdmin || viewer?.isOwner));

  const { entry: item, loading, error, notFound } = useCampaignContentEntry<MagicItem>({
    campaignId: campaignId ?? undefined,
    entryId: magicItemId,
    fetchEntry: magicItemRepo.getEntry,
  });

  const methods = useForm<FormValues>({
    defaultValues: { name: '', description: '', imageKey: '', accessPolicy: DEFAULT_VISIBILITY_PUBLIC, slot: 'wondrous', rarity: 'common', requiresAttunement: false, effectsJson: '[]' },
  });
  const { reset, setValue, watch, formState: { isDirty } } = methods;
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const [patchText, setPatchText] = useState('');
  const [initialPatchText, setInitialPatchText] = useState('');
  const [patchSaveError, setPatchSaveError] = useState<string | null>(null);

  const isSystem = item?.source === 'system';
  const isCampaign = item?.source === 'campaign';

  useEffect(() => {
    if (!item || !isCampaign) return;
    reset({
      name: item.name, description: item.description ?? '', imageKey: item.imageKey ?? '',
      accessPolicy: item.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
      slot: item.slot ?? 'wondrous', rarity: item.rarity ?? 'common',
      requiresAttunement: item.requiresAttunement ?? false,
      effectsJson: JSON.stringify(item.effects ?? [], null, 2),
    });
  }, [item, isCampaign, reset]);

  useEffect(() => {
    if (!campaignId || !magicItemId || !item || !isSystem) return;
    let cancelled = false;
    getContentPatch(campaignId).then(doc => {
      if (cancelled) return;
      const existing = getEntryPatch(doc, 'magicItems', magicItemId);
      if (existing) { const t = JSON.stringify(existing, null, 2); setPatchText(t); setInitialPatchText(t); }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [campaignId, magicItemId, item, isSystem]);

  useEffect(() => { const sub = watch(() => { setSuccess(false); setErrors([]); }); return () => sub.unsubscribe(); }, [watch]);

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback((next: Visibility) => setValue('accessPolicy', next, { shouldDirty: true }), [setValue]);

  const handleCampaignSubmit = useCallback(async (values: FormValues) => {
    if (!campaignId || !magicItemId) return;
    setSaving(true); setSuccess(false); setErrors([]);
    let effects: unknown[] = [];
    try { effects = JSON.parse(values.effectsJson); } catch { /* keep empty */ }
    const input: MagicItemInput = {
      name: values.name.trim(), description: values.description.trim(), accessPolicy: values.accessPolicy,
      slot: values.slot as MagicItemInput['slot'], rarity: values.rarity as MagicItemInput['rarity'],
      requiresAttunement: values.requiresAttunement, effects: effects as MagicItemInput['effects'],
    };
    try {
      const updated = await magicItemRepo.updateEntry(campaignId, magicItemId, input);
      reset({
        name: updated.name, description: updated.description ?? '', imageKey: updated.imageKey ?? '',
        accessPolicy: updated.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC,
        slot: updated.slot ?? 'wondrous', rarity: updated.rarity ?? 'common',
        requiresAttunement: updated.requiresAttunement ?? false,
        effectsJson: JSON.stringify(updated.effects ?? [], null, 2),
      });
      setSuccess(true);
    } catch (err) { setErrors([{ path: '', code: 'SAVE_FAILED', message: (err as Error).message }]); }
    finally { setSaving(false); }
  }, [campaignId, magicItemId, reset]);

  const patchDirty = patchText !== initialPatchText;
  const tryParse = useCallback((t: string) => { const s = t.trim(); if (!s) return { valid: true, value: {} }; try { return { valid: true, value: JSON.parse(s) }; } catch { return { valid: false, value: null }; } }, []);
  const parsed = tryParse(patchText);

  const handlePatchSave = useCallback(async () => {
    if (!campaignId || !magicItemId || !parsed.valid) return;
    setSaving(true); setPatchSaveError(null);
    try { await upsertEntryPatch(campaignId, 'magicItems', magicItemId, parsed.value); setInitialPatchText(patchText); setSuccess(true); }
    catch (err) { setPatchSaveError((err as Error).message); } finally { setSaving(false); }
  }, [campaignId, magicItemId, parsed, patchText]);

  const handleRemovePatch = useCallback(async () => {
    if (!campaignId || !magicItemId) return; setSaving(true);
    try { await removeEntryPatch(campaignId, 'magicItems', magicItemId); setPatchText(''); setInitialPatchText(''); setSuccess(true); }
    catch (err) { setPatchSaveError((err as Error).message); } finally { setSaving(false); }
  }, [campaignId, magicItemId]);

  const handleDelete = useCallback(async () => {
    if (!campaignId || !magicItemId) return;
    await magicItemRepo.deleteEntry(campaignId, magicItemId);
    navigate(`/campaigns/${campaignId}/world/equipment/magic-items`, { replace: true });
  }, [campaignId, magicItemId, navigate]);

  const handleBack = useCallback(() => navigate(`/campaigns/${campaignId}/world/equipment/magic-items`), [navigate, campaignId]);
  
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error || notFound || !item) return <AppAlert tone="danger">{error ?? 'Magic item not found.'}</AppAlert>;

  if (isSystem) {
    return (
      <EntryEditorLayout typeLabel="Magic Item Patch" isNew={false} saving={saving} dirty={patchDirty} success={success}
        errors={patchSaveError ? [{ path: '', code: 'SAVE_FAILED', message: patchSaveError }] : []} onSave={handlePatchSave} onBack={handleBack}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={600}>Patching: {item.name}</Typography>
          {item.patched && <AppBadge label="Patched" tone="warning" size="small" />}
          <Typography variant="body2" color="text.secondary">Enter a JSON object to deep-merge into this system magic item for your campaign.</Typography>
          <JsonPreviewField label="Patch JSON" value={patchText}
            onChange={v => { setPatchText(v); setSuccess(false); setPatchSaveError(null); }}
            placeholder={'{\n  "description": "Custom description...",\n  "rarity": "legendary"\n}'} minRows={8} maxRows={20} />
          {initialPatchText && <Button variant="outlined" color="error" size="small" onClick={handleRemovePatch} disabled={saving} sx={{ alignSelf: 'flex-start' }}>Remove patch</Button>}
        </Stack>
      </EntryEditorLayout>
    );
  }

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout typeLabel="Magic Item" isNew={false} saving={saving} dirty={isDirty} success={success}
        errors={errors} formId={FORM_ID} onBack={handleBack} canDelete={canDelete} onDelete={handleDelete}
        validateDelete={async () => ({ allowed: true as const })}
        showPolicyField policyValue={policyValue} onPolicyChange={handlePolicyChange} policyCharacters={policyCharacters}>
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleCampaignSubmit)} noValidate>
          <Stack spacing={2.5}>
            <Controller name="name" control={methods.control} render={({ field }) => <TextField {...field} label="Name" size="small" fullWidth required />} />
            <Controller name="description" control={methods.control} render={({ field }) => <TextField {...field} label="Description" size="small" fullWidth multiline minRows={3} maxRows={8} />} />
            <Controller name="imageKey" control={methods.control} render={({ field }) => <TextField {...field} label="Image Key" size="small" fullWidth helperText="/assets/... or CDN key" />} />
            <Stack direction="row" spacing={2}>
              <Controller name="slot" control={methods.control} render={({ field }) => <TextField {...field} label="Slot" size="small" fullWidth />} />
              <Controller name="rarity" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Rarity" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="common">Common</option><option value="uncommon">Uncommon</option><option value="rare">Rare</option>
                  <option value="very-rare">Very Rare</option><option value="legendary">Legendary</option><option value="artifact">Artifact</option>
                </TextField>
              )} />
            </Stack>
            <Controller name="requiresAttunement" control={methods.control} render={({ field }) => (
              <FormControlLabel control={<Checkbox checked={field.value} onChange={field.onChange} size="small" />} label="Requires Attunement" />
            )} />
            <Controller name="effectsJson" control={methods.control} render={({ field }) => (
              <JsonPreviewField label="Effects (JSON array)" value={field.value} onChange={field.onChange}
                placeholder='[{ "kind": "bonus", "target": "attack", "value": 1 }]' minRows={3} maxRows={8} />
            )} />
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
