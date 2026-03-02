// Campaign-owned equipment items are editable. System items are edited via patching.
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { magicItemRepo } from '@/features/content/domain/repo';
import type { MagicItemInput } from '@/features/content/domain/types';
import { JsonPreviewField } from '@/ui/patterns';

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

const FORM_ID = 'magic-item-create-form';

const DEFAULT_VALUES: FormValues = {
  name: '',
  description: '',
  imageKey: '',
  accessPolicy: DEFAULT_VISIBILITY_PUBLIC,
  slot: 'wondrous',
  rarity: 'common',
  requiresAttunement: false,
  effectsJson: '[]',
};

export default function MagicItemCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<FormValues>({ defaultValues: DEFAULT_VALUES });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback((next: Visibility) => {
    setValue('accessPolicy', next, { shouldDirty: true });
  }, [setValue]);

  const handleSubmit = useCallback(async (values: FormValues) => {
    if (!campaignId) return;
    setSaving(true);
    setErrors([]);

    let effects: unknown[] = [];
    try { effects = JSON.parse(values.effectsJson); } catch { /* keep empty */ }

    const input: MagicItemInput = {
      name: values.name.trim(),
      description: values.description.trim(),
      accessPolicy: values.accessPolicy,
      slot: values.slot as MagicItemInput['slot'],
      rarity: values.rarity as MagicItemInput['rarity'],
      requiresAttunement: values.requiresAttunement,
      effects: effects as MagicItemInput['effects'],
    };

    try {
      const created = await magicItemRepo.createEntry(campaignId, input);
      navigate(`/campaigns/${campaignId}/world/equipment/magic-items/${created.id}`, { replace: true });
    } catch (err) {
      setErrors([{ path: '', code: 'SAVE_FAILED', message: (err as Error).message }]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/magic-items`);
  }, [navigate, campaignId]);

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Magic Item"
        isNew
        saving={saving}
        dirty={isDirty}
        success={false}
        errors={errors}
        formId={FORM_ID}
        onBack={handleBack}
        showPolicyField
        policyValue={policyValue}
        onPolicyChange={handlePolicyChange}
        policyCharacters={policyCharacters}
      >
        <form id={FORM_ID} onSubmit={methods.handleSubmit(handleSubmit)} noValidate>
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
              <Controller name="slot" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Slot" size="small" fullWidth />
              )} />
              <Controller name="rarity" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Rarity" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="very-rare">Very Rare</option>
                  <option value="legendary">Legendary</option>
                  <option value="artifact">Artifact</option>
                </TextField>
              )} />
            </Stack>
            <Controller name="requiresAttunement" control={methods.control} render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value} onChange={field.onChange} size="small" />}
                label="Requires Attunement"
              />
            )} />
            <Controller name="effectsJson" control={methods.control} render={({ field }) => (
              <JsonPreviewField
                label="Effects (JSON array)"
                value={field.value}
                onChange={field.onChange}
                placeholder='[{ "kind": "bonus", "target": "attack", "value": 1 }]'
                minRows={3}
                maxRows={8}
              />
            )} />
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
