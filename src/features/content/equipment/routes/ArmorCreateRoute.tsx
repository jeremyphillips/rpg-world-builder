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
import { armorRepo } from '@/features/content/domain/repo';
import {
  type ArmorFormValues,
  getArmorFieldConfigs,
  ARMOR_FORM_DEFAULTS,
  toArmorInput,
} from '@/features/content/equipment/armor/domain';

const FORM_ID = 'armor-create-form';

export default function ArmorCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<ArmorFormValues>({
    defaultValues: ARMOR_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<ArmorFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    ArmorFormValues,
    Parameters<typeof armorRepo.createEntry>[1],
    Awaited<ReturnType<typeof armorRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: armorRepo.createEntry,
    toInput: toArmorInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/equipment/armor/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/armor`);
  }, [navigate, campaignId]);

  const fieldConfigs = getArmorFieldConfigs({ policyCharacters });

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
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
