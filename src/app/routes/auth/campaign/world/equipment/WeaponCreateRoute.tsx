// Campaign-owned equipment items are editable. System items are edited via patching.
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { weaponRepo } from '@/features/content/domain/repo';
import type { WeaponInput } from '@/features/content/domain/types';
import { JsonPreviewField } from '@/ui/patterns';

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

const FORM_ID = 'weapon-create-form';

const DEFAULT_VALUES: FormValues = {
  name: '',
  description: '',
  imageKey: '',
  accessPolicy: DEFAULT_VISIBILITY_PUBLIC,
  category: 'simple',
  mode: 'melee',
  damageDefault: '1d6',
  damageType: 'slashing',
  mastery: '',
  propertiesJson: '[]',
};

export default function WeaponCreateRoute() {
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

    let properties: string[] = [];
    try { properties = JSON.parse(values.propertiesJson); } catch { /* keep empty */ }

    const input: WeaponInput = {
      name: values.name.trim(),
      description: values.description.trim(),
      accessPolicy: values.accessPolicy,
      category: values.category as WeaponInput['category'],
      mode: values.mode as WeaponInput['mode'],
      damage: { default: values.damageDefault },
      damageType: values.damageType,
      mastery: values.mastery,
      properties,
    };

    try {
      const created = await weaponRepo.createEntry(campaignId, input);
      navigate(`/campaigns/${campaignId}/world/equipment/weapons/${created.id}`, { replace: true });
    } catch (err) {
      setErrors([{ path: '', code: 'SAVE_FAILED', message: (err as Error).message }]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/weapons`);
  }, [navigate, campaignId]);

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Weapon"
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
              <Controller name="category" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Category" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="simple">Simple</option>
                  <option value="martial">Martial</option>
                </TextField>
              )} />
              <Controller name="mode" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Mode" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="melee">Melee</option>
                  <option value="ranged">Ranged</option>
                </TextField>
              )} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Controller name="damageDefault" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Damage (e.g. 1d6)" size="small" fullWidth />
              )} />
              <Controller name="damageType" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Damage Type" size="small" fullWidth />
              )} />
              <Controller name="mastery" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Mastery" size="small" fullWidth />
              )} />
            </Stack>
            <Controller name="propertiesJson" control={methods.control} render={({ field }) => (
              <JsonPreviewField
                label="Properties (JSON array)"
                value={field.value}
                onChange={field.onChange}
                placeholder='["light", "finesse"]'
                minRows={2}
                maxRows={4}
              />
            )} />
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
