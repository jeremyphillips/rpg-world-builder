import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/shared/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { useAccessPolicyField } from '@/features/content/shared/hooks/useAccessPolicyField';
import { useCreateEntrySubmit } from '@/features/content/shared/hooks/useCreateEntrySubmit';
import type { ValidationError } from '@/features/content/shared/hooks/editRoute.types';
import { classRepo } from '@/features/content/classes/domain';
import {
  type ClassFormValues,
  getClassFieldConfigs,
  CLASS_FORM_DEFAULTS,
  toClassInput,
} from '@/features/content/classes/domain/forms';
import { ConditionalFormRenderer } from '@/ui/patterns';

const FORM_ID = 'class-create-form';

export default function ClassCreateRoute() {
  const { campaignId } = useActiveCampaign();
  const navigate = useNavigate();
  const { approvedCharacters: policyCharacters } = useCampaignMembers();

  const methods = useForm<ClassFormValues>({
    defaultValues: CLASS_FORM_DEFAULTS,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { setValue, watch, formState: { isDirty } } = methods;

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const { policyValue, handlePolicyChange } =
    useAccessPolicyField<ClassFormValues>(watch, setValue);

  const handleSubmit = useCreateEntrySubmit<ClassFormValues, Parameters<typeof classRepo.createEntry>[1], Awaited<ReturnType<typeof classRepo.createEntry>>>({
    campaignId,
    navigate,
    createEntry: classRepo.createEntry,
    toInput: toClassInput,
    getSuccessPath: (cid, created) =>
      `/campaigns/${cid}/world/classes/${created.id}`,
    setSaving,
    setErrors,
  });

  const handleBack = useCallback(() => {
    navigate(`/campaigns/${campaignId}/world/classes`);
  }, [navigate, campaignId]);

  const fieldConfigs = getClassFieldConfigs({ policyCharacters });

  return (
    <FormProvider {...methods}>
      <EntryEditorLayout
        typeLabel="Class"
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
