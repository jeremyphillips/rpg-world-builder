// Campaign-owned equipment items are editable. System items are edited via patching.
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { ConditionalFormRenderer } from '@/ui/patterns';
import type { Visibility } from '@/shared/types';
import { useActiveCampaign } from '@/app/providers/ActiveCampaignProvider';
import { EntryEditorLayout } from '@/features/content/components';
import { useCampaignMembers } from '@/features/campaign/hooks';
import { magicItemRepo } from '@/features/content/domain/repo';
import type { MagicItemInput } from '@/features/content/domain/types';
import {
  type MagicItemFormValues,
  getMagicItemFieldConfigs,
  MAGIC_ITEM_FORM_DEFAULTS,
  toMagicItemInput,
} from '@/features/equipment/magicItems/forms';

type ValidationError = { path: string; code: string; message: string };

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

  const policyValue = watch('accessPolicy');
  const handlePolicyChange = useCallback(
    (next: Visibility) => {
      setValue('accessPolicy', next, { shouldDirty: true });
    },
    [setValue]
  );

  const handleSubmit = useCallback(
    async (values: MagicItemFormValues) => {
      if (!campaignId) return;
      setSaving(true);
      setErrors([]);

      const input: MagicItemInput = toMagicItemInput(values);

      try {
        const created = await magicItemRepo.createEntry(campaignId, input);
        navigate(
          `/campaigns/${campaignId}/world/equipment/magic-items/${created.id}`,
          { replace: true }
        );
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
