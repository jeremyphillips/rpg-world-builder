import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import type { Visibility } from '@/shared/types/visibility';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { classRepo } from '@/features/content/domain/repo';
import type { ClassInput } from '@/features/content/domain/repo';
import {
  type ClassFormValues,
  getClassFieldConfigs,
  CLASS_FORM_DEFAULTS,
  toClassInput,
} from '@/features/classes/forms';
import { ConditionalFormRenderer } from '@/ui/patterns';

type ValidationError = { path: string; code: string; message: string };

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

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback(
    (next: Visibility) => {
      setValue('accessPolicy', next, { shouldDirty: true });
    },
    [setValue]
  );

  const handleSubmit = useCallback(
    async (values: ClassFormValues) => {
      if (!campaignId) return;
      setSaving(true);
      setErrors([]);

      const input: ClassInput = toClassInput(values);

      try {
        const created = await classRepo.createEntry(campaignId, input);
        navigate(`/campaigns/${campaignId}/world/classes/${created.id}`, {
          replace: true,
        });
      } catch (err) {
        setErrors([
          { path: '', code: 'SAVE_FAILED', message: (err as Error).message },
        ]);
      } finally {
        setSaving(false);
      }
    },
    [campaignId, navigate]
  );

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
