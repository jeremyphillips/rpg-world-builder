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
import { armorRepo } from '@/features/content/domain/repo';
import type { ArmorInput } from '@/features/content/domain/types';

type ValidationError = { path: string; code: string; message: string };

type FormValues = {
  name: string;
  description: string;
  imageKey: string;
  accessPolicy: Visibility;
  category: string;
  material: string;
  baseAC: string;
  acBonus: string;
  stealthDisadvantage: boolean;
};

const FORM_ID = 'armor-create-form';

const DEFAULT_VALUES: FormValues = {
  name: '',
  description: '',
  imageKey: '',
  accessPolicy: DEFAULT_VISIBILITY_PUBLIC,
  category: 'light',
  material: 'metal',
  baseAC: '',
  acBonus: '',
  stealthDisadvantage: false,
};

export default function ArmorCreateRoute() {
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

    const input: ArmorInput = {
      name: values.name.trim(),
      description: values.description.trim(),
      accessPolicy: values.accessPolicy,
      category: values.category as ArmorInput['category'],
      material: values.material as ArmorInput['material'],
      baseAC: values.baseAC ? Number(values.baseAC) : undefined,
      acBonus: values.acBonus ? Number(values.acBonus) : undefined,
      stealthDisadvantage: values.stealthDisadvantage,
    };

    try {
      const created = await armorRepo.createEntry(campaignId, input);
      navigate(`/campaigns/${campaignId}/world/equipment/armor/${created.id}`, { replace: true });
    } catch (err) {
      setErrors([{ path: '', code: 'SAVE_FAILED', message: (err as Error).message }]);
    } finally {
      setSaving(false);
    }
  }, [campaignId, navigate]);

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/armor`);
  }, [navigate, campaignId]);

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Armor"
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
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                  <option value="shields">Shields</option>
                </TextField>
              )} />
              <Controller name="material" control={methods.control} render={({ field }) => (
                <TextField {...field} select label="Material" size="small" fullWidth slotProps={{ select: { native: true } }}>
                  <option value="metal">Metal</option>
                  <option value="organic">Organic</option>
                  <option value="fabric">Fabric</option>
                  <option value="wood">Wood</option>
                  <option value="stone">Stone</option>
                </TextField>
              )} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Controller name="baseAC" control={methods.control} render={({ field }) => (
                <TextField {...field} label="Base AC" size="small" type="number" fullWidth />
              )} />
              <Controller name="acBonus" control={methods.control} render={({ field }) => (
                <TextField {...field} label="AC Bonus" size="small" type="number" fullWidth />
              )} />
            </Stack>
          </Stack>
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
