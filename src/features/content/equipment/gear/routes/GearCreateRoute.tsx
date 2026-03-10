// Campaign-owned equipment items are editable. System items are edited via patching.
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { ConditionalFormRenderer } from '@/ui/patterns';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { useCreateEntrySubmit } from '@/features/content/shared/hooks/useCreateEntrySubmit';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import { gearRepo } from '../domain/repo/gearRepo';
import {
  type GearFormValues,
  getGearFieldConfigs,
  GEAR_FORM_DEFAULTS,
  toGearInput,
} from '../domain/forms';

const FORM_ID = 'gear-create-form';

export default function GearCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<GearFormValues>({
    defaultValues: GEAR_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<GearFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    GearFormValues,
    Parameters<typeof gearRepo.createEntry>[1],
    Awaited<ReturnType<typeof gearRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: gearRepo.createEntry,
    toInput: toGearInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/equipment/gear/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/gear`);
  }, [navigate, campaignId]);

  const fieldConfigs = getGearFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Gear"
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
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
