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
import { magicItemRepo } from '../domain/repo/magicItemRepo';
import {
  type MagicItemFormValues,
  getMagicItemFieldConfigs,
  MAGIC_ITEM_FORM_DEFAULTS,
  toMagicItemInput,
} from '../domain/forms';

const FORM_ID = 'magic-item-create-form';

export default function MagicItemCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<MagicItemFormValues>({
    defaultValues: MAGIC_ITEM_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<MagicItemFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<
    MagicItemFormValues,
    Parameters<typeof magicItemRepo.createEntry>[1],
    Awaited<ReturnType<typeof magicItemRepo.createEntry>>
  >({
    campaignId,
    navigate,
    createEntry: magicItemRepo.createEntry,
    toInput: toMagicItemInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/equipment/magic-items/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/equipment/magic-items`);
  }, [navigate, campaignId]);

  const fieldConfigs = getMagicItemFieldConfigs({ policyCharacters });

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
          <ConditionalFormRenderer fields={fieldConfigs} />
        </form>
      </EntryEditorLayout>
    </FormProvider>
  );
}
